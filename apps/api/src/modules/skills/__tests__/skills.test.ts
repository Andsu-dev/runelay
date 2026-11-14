import { afterEach, beforeAll, describe, expect, mock, spyOn, test } from "bun:test";
import type { Page, SkillFileView, SkillListItemView, SkillView } from "@runelay/shared";
import { db } from "@/db/connection";
import {
  deleteSkillRow,
  findSkill,
  findSkillFile,
  insertSkill,
  listSkills,
  updateSkillRow,
  upsertSkills,
} from "@/modules/skills/repositories/skill.repository";
import { createSkill, importSkills, updateSkill } from "@/modules/skills/services/skill.service";
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
      insertSkill(org, input),
      updateSkillRow(org, "bare", { name: "b" }),
      deleteSkillRow(org, "bare"),
      upsertSkills(org, [input]),
      createSkill(org, input),
      updateSkill(org, "bare", { name: "b" }),
      importSkills(org, { skills: [input] }),
    ];
    for (const result of results) expect(result.error?.code).toBe("STORAGE_FAILED");
  });
});
