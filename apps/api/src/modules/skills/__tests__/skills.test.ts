import { afterEach, beforeAll, describe, expect, mock, spyOn, test } from "bun:test";
import type { Page, SkillExportView, SkillFileView, SkillListItemView, SkillView } from "@runelay/shared";
import { db } from "@/db/connection";
import {
  deleteSkillRow,
  exportSkills,
  findSkill,
  findSkillFile,
  insertSkill,
  listSkills,
  skillExists,
  updateSkillRow,
  upsertSkillFile,
  upsertSkills,
} from "@/modules/skills/repositories/skill.repository";
import {
  createSkill,
  importSkills,
  updateSkill,
  writeSkill,
  writeSkillFile,
} from "@/modules/skills/services/skill.service";
import { body, call, createApiKey, resetDatabase, signUp, type TestAccount } from "../../../../test/helpers";

let owner: TestAccount;
let stranger: TestAccount;
let ownerKey: string;

const create = (account: TestAccount, json: Record<string, unknown>) =>
  call("/v1/skills", { method: "POST", cookie: account.cookie, json });

const list = async (account: TestAccount, query = "") =>
  (await body<Page<SkillListItemView>>(await call(`/v1/skills${query}`, { cookie: account.cookie }))).data;

beforeAll(async () => {
  resetDatabase();
  owner = await signUp("Skill Owner");
  stranger = await signUp("Skill Stranger");
  ownerKey = (await createApiKey(owner)).key;
});

afterEach(() => {
  mock.restore();
});

describe("skills routes", () => {
  test("requires authentication", async () => {
    expect((await call("/v1/skills")).status).toBe(401);
  });

  test("creates a skill with files and defaults", async () => {
    const response = await create(owner, {
      slug: "deploy:prod",
      name: "Deploy",
      body: "Run the quasarflow pipeline",
      files: [
        { path: "scripts/run.sh", content: "echo ã" },
        { path: "README.md", content: "readme" },
      ],
    });
    expect(response.status).toBe(201);
    const { data } = await body<SkillView>(response);
    expect(data.enabled).toBe(true);
    expect(data.description).toBe("");
    expect(data.fileCount).toBe(2);
    expect(data.files).toEqual([
      { path: "README.md", size: 6 },
      { path: "scripts/run.sh", size: 7 },
    ]);
    const bare = await create(owner, { slug: "bare", name: "Alpha bare", body: "", enabled: false });
    expect((await body<SkillView>(bare)).data.files).toEqual([]);
  });

  test("rejects duplicates and invalid file paths", async () => {
    const duplicate = await create(owner, { slug: "bare", name: "Again", body: "" });
    expect(duplicate.status).toBe(409);
    expect((await body(duplicate)).error?.code).toBe("ALREADY_EXISTS");
    const traversal = await create(owner, {
      slug: "evil",
      name: "Evil",
      body: "",
      files: [{ path: "../etc/passwd", content: "" }],
    });
    expect(traversal.status).toBe(400);
  });

  test("reads skills and single files", async () => {
    const skill = await call("/v1/skills/deploy:prod", { bearer: ownerKey });
    expect((await body<SkillView>(skill)).data.name).toBe("Deploy");
    const file = await call("/v1/skills/deploy:prod/files?path=scripts/run.sh", { cookie: owner.cookie });
    expect((await body<SkillFileView>(file)).data).toEqual({ path: "scripts/run.sh", content: "echo ã" });
    const missing = await call("/v1/skills/deploy:prod/files?path=nope.txt", { cookie: owner.cookie });
    expect(missing.status).toBe(404);
    expect((await body(missing)).error?.code).toBe("SKILL_FILE_NOT_FOUND");
    expect((await call("/v1/skills/deploy:prod/files", { cookie: owner.cookie })).status).toBe(400);
    const unknown = await call("/v1/skills/ghost", { cookie: owner.cookie });
    expect(unknown.status).toBe(404);
    expect((await body(unknown)).error?.code).toBe("SKILL_NOT_FOUND");
  });

  test("exports several skills with file contents in one call", async () => {
    const response = await call("/v1/skills/export", {
      method: "POST",
      bearer: ownerKey,
      json: { slugs: ["deploy:prod", "bare", "missing"] },
    });
    const { data } = await body<SkillExportView[]>(response);
    expect(data.map((skill) => skill.slug)).toEqual(["bare", "deploy:prod"]);
    expect(data[1]?.files).toEqual([
      { path: "README.md", content: "readme" },
      { path: "scripts/run.sh", content: "echo ã" },
    ]);
    expect(data[0]?.files).toEqual([]);
    const foreign = await call("/v1/skills/export", {
      method: "POST",
      cookie: stranger.cookie,
      json: { slugs: ["deploy:prod"] },
    });
    expect((await body<SkillExportView[]>(foreign)).data).toEqual([]);
    const tooMany = await call("/v1/skills/export", {
      method: "POST",
      bearer: ownerKey,
      json: { slugs: Array.from({ length: 51 }, (_, index) => `s${index}`) },
    });
    expect(tooMany.status).toBe(400);
  });

  test("updates fields and replaces files only when sent", async () => {
    const renamed = await call("/v1/skills/deploy:prod", {
      method: "PATCH",
      cookie: owner.cookie,
      json: { name: "Deploy v2", description: "Ships it", enabled: false },
    });
    const kept = (await body<SkillView>(renamed)).data;
    expect(kept).toMatchObject({ name: "Deploy v2", description: "Ships it", enabled: false, fileCount: 2 });
    const replaced = await call("/v1/skills/deploy:prod", {
      method: "PATCH",
      cookie: owner.cookie,
      json: { body: "new body nebulith", enabled: true, files: [{ path: "only.txt", content: "x" }] },
    });
    const view = (await body<SkillView>(replaced)).data;
    expect(view.enabled).toBe(true);
    expect(view.files).toEqual([{ path: "only.txt", size: 1 }]);
    expect(view.body).toBe("new body nebulith");
    const missing = await call("/v1/skills/ghost", { method: "PATCH", cookie: owner.cookie, json: { name: "x" } });
    expect(missing.status).toBe(404);
    expect((await call("/v1/skills/bare", { method: "PATCH", cookie: owner.cookie, json: {} })).status).toBe(400);
  });

  test("lists with pagination, enabled filter and full text search", async () => {
    const page = await list(owner, "?limit=1");
    expect(page.total).toBe(2);
    expect(page.items.map((item) => item.slug)).toEqual(["bare"]);
    expect(page.items[0]?.enabled).toBe(false);
    expect(page.nextCursor).toBe(1);
    const second = await list(owner, "?limit=1&cursor=1");
    expect(second.items.map((item) => item.slug)).toEqual(["deploy:prod"]);
    expect(second.nextCursor).toBeNull();
    expect((await list(owner, "?enabled=true")).items.map((item) => item.slug)).toEqual(["deploy:prod"]);
    expect((await list(owner, "?enabled=false")).items.map((item) => item.slug)).toEqual(["bare"]);
    const search = await list(owner, "?query=nebuli");
    expect(search.items.map((item) => item.slug)).toEqual(["deploy:prod"]);
    expect(search.items[0]?.fileCount).toBe(1);
    expect((await list(owner, "?query=nebulith&enabled=false")).total).toBe(0);
    expect((await list(owner, "?query=quasarflow")).total).toBe(0);
    expect((await list(owner, "?query=%25%25")).total).toBe(2);
  });

  test("isolates skills between organizations", async () => {
    expect((await list(stranger)).total).toBe(0);
    expect((await list(stranger, "?query=nebulith")).total).toBe(0);
    expect((await call("/v1/skills/deploy:prod", { cookie: stranger.cookie })).status).toBe(404);
    expect((await call("/v1/skills/deploy:prod/files?path=only.txt", { cookie: stranger.cookie })).status).toBe(404);
    const patch = await call("/v1/skills/deploy:prod", {
      method: "PATCH",
      cookie: stranger.cookie,
      json: { name: "hijack" },
    });
    expect(patch.status).toBe(404);
    expect((await call("/v1/skills/deploy:prod", { method: "DELETE", cookie: stranger.cookie })).status).toBe(404);
    expect((await create(stranger, { slug: "deploy:prod", name: "Mine", body: "" })).status).toBe(201);
    expect(findSkill(owner.organizationId, "deploy:prod").data?.name).toBe("Deploy v2");
  });

  test("imports skills as upserts replacing files", async () => {
    const response = await call("/v1/skills/import", {
      method: "POST",
      cookie: owner.cookie,
      json: {
        skills: [
          { slug: "bare", name: "Bare imported", body: "imported", files: [{ path: "a.md", content: "aa" }] },
          { slug: "fresh", name: "Fresh", body: "fresh body" },
        ],
      },
    });
    expect((await body<{ imported: number }>(response)).data.imported).toBe(2);
    const bare = findSkill(owner.organizationId, "bare").data;
    expect(bare).toMatchObject({ name: "Bare imported", enabled: true, files: [{ path: "a.md", size: 2 }] });
    expect(findSkill(owner.organizationId, "fresh").data?.files).toEqual([]);
  });

  test("deletes a skill with its files and search rows", async () => {
    const response = await call("/v1/skills/deploy:prod", { method: "DELETE", cookie: owner.cookie });
    expect(response.status).toBe(200);
    expect((await call("/v1/skills/deploy:prod", { cookie: owner.cookie })).status).toBe(404);
    expect(findSkillFile(owner.organizationId, "deploy:prod", "only.txt").error?.code).toBe("SKILL_FILE_NOT_FOUND");
    expect((await list(owner, "?query=nebulith")).total).toBe(0);
    expect((await call("/v1/skills/deploy:prod", { method: "DELETE", cookie: owner.cookie })).status).toBe(404);
    expect(findSkill(stranger.organizationId, "deploy:prod").data?.name).toBe("Mine");
  });
});

describe("agent writes", () => {
  test("writeSkill creates and updates, writeSkillFile adds files to an existing skill", () => {
    const org = owner.organizationId;
    const created = writeSkill(org, { slug: "agent-written", body: "v1" });
    expect(created.data).toMatchObject({
      slug: "agent-written",
      name: "agent-written",
      description: "",
      enabled: true,
      body: "v1",
      files: [],
    });
    const file = writeSkillFile(org, "agent-written", { path: "refs/notes.md", content: "abc" });
    expect(file.data?.files).toEqual([{ path: "refs/notes.md", size: 3 }]);
    const replaced = writeSkillFile(org, "agent-written", { path: "refs/notes.md", content: "abcd" });
    expect(replaced.data?.files).toEqual([{ path: "refs/notes.md", size: 4 }]);
    expect(findSkillFile(org, "agent-written", "refs/notes.md").data?.content).toBe("abcd");
    const updated = writeSkill(org, { slug: "agent-written", body: "v2", name: "Agent", description: "d" });
    expect(updated.data).toMatchObject({ name: "Agent", description: "d", body: "v2" });
    expect(updated.data?.files).toEqual([{ path: "refs/notes.md", size: 4 }]);
    expect(skillExists(org, "agent-written").data).toBe(true);
    expect(skillExists(stranger.organizationId, "agent-written").data).toBe(false);
    expect(writeSkillFile(org, "no-skill-here", { path: "a.md", content: "" }).error?.code).toBe("SKILL_NOT_FOUND");
  });

  test("skips pushed skills older than the stored copy", async () => {
    const org = owner.organizationId;
    const base = { description: "", enabled: true, files: [] };
    upsertSkills(org, [{ ...base, slug: "pushed-skill", name: "Server", body: "server" }]);
    const response = await call("/v1/skills/import", {
      method: "POST",
      cookie: owner.cookie,
      json: {
        skills: [
          { slug: "pushed-skill", name: "Stale", body: "stale", updatedAt: "2000-01-01T00:00:00Z" },
          { slug: "pushed-fresh", name: "Fresh", body: "fresh", updatedAt: "2000-01-01T00:00:00Z" },
        ],
      },
    });
    expect((await body<{ imported: number; skipped: string[] }>(response)).data).toEqual({
      imported: 1,
      written: 1,
      skipped: ["pushed-skill"],
      unchanged: [],
    });
    expect(findSkill(org, "pushed-skill").data?.body).toBe("server");
    const newer = upsertSkills(org, [
      { ...base, slug: "pushed-skill", name: "Local", body: "local", updatedAt: "2999-01-01T00:00:00Z" },
    ]);
    expect(newer.data).toEqual({ imported: 1, written: 1, skipped: [], unchanged: [] });
    expect(findSkill(org, "pushed-skill").data?.body).toBe("local");
  });
});

describe("push comparison", () => {
  test("reports identical skills as unchanged without writing, even when the server is newer", () => {
    const org = owner.organizationId;
    const files = [
      { path: "b.md", content: "bb" },
      { path: "a.md", content: "aa" },
    ];
    const skill = { slug: "same-skill", name: "Same", description: "d", body: "body", enabled: true, files };
    upsertSkills(org, [skill]);
    db.query("UPDATE skills SET updated_at = '2999-01-01T00:00:00.000Z' WHERE organization_id = ? AND slug = ?").run(
      org,
      "same-skill",
    );
    const identical = upsertSkills(org, [
      { ...skill, files: [...files].reverse(), updatedAt: "2000-01-01T00:00:00Z" },
      { ...skill, slug: "other-skill" },
    ]);
    expect(identical.data).toEqual({ imported: 2, written: 1, skipped: [], unchanged: ["same-skill"] });
    expect(findSkill(org, "same-skill").data?.updatedAt).toBe("2999-01-01T00:00:00.000Z");
    const again = upsertSkills(org, [skill, { ...skill, slug: "other-skill" }]);
    expect(again.data).toEqual({ imported: 2, written: 0, skipped: [], unchanged: ["same-skill", "other-skill"] });
    const variants = [
      { ...skill, name: "Renamed" },
      { ...skill, description: "other" },
      { ...skill, body: "other" },
      { ...skill, enabled: false },
      { ...skill, files: [{ path: "a.md", content: "changed" }] },
    ];
    for (const variant of variants) {
      expect(upsertSkills(org, [{ ...variant, updatedAt: "2000-01-01T00:00:00Z" }]).data).toEqual({
        imported: 0,
        written: 0,
        skipped: ["same-skill"],
        unchanged: [],
      });
    }
    const changed = upsertSkills(org, [{ ...skill, body: "changed", updatedAt: "2999-06-01T00:00:00Z" }]);
    expect(changed.data).toEqual({ imported: 1, written: 1, skipped: [], unchanged: [] });
    expect(findSkill(org, "same-skill").data?.body).toBe("changed");
  });
});

describe("storage failures", () => {
  test("every repository and service function returns STORAGE_FAILED", () => {
    const org = owner.organizationId;
    const input = { slug: "boom", name: "b", description: "", body: "", enabled: true, files: [] };
    spyOn(db, "query").mockImplementation(() => {
      throw new Error("disk on fire");
    });
    const results = [
      listSkills(org, { cursor: 0, limit: 10 }),
      findSkill(org, "bare"),
      findSkillFile(org, "bare", "a.md"),
      exportSkills(org, ["bare"]),
      insertSkill(org, input),
      updateSkillRow(org, "bare", { name: "b" }),
      deleteSkillRow(org, "bare"),
      upsertSkills(org, [input]),
      createSkill(org, input),
      updateSkill(org, "bare", { name: "b" }),
      importSkills(org, { skills: [input] }),
      skillExists(org, "bare"),
      upsertSkillFile(org, "bare", { path: "a.md", content: "" }),
      writeSkill(org, { slug: "bare", body: "" }),
      writeSkillFile(org, "bare", { path: "a.md", content: "" }),
    ];
    for (const result of results) expect(result.error?.code).toBe("STORAGE_FAILED");
  });
});
