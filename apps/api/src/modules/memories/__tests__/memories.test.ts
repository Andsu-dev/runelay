import { afterEach, beforeAll, describe, expect, mock, spyOn, test } from "bun:test";
import type {
  ImportResultView,
  MemoryHealthView,
  MemoryListItemView,
  MemoryVersionView,
  MemoryView,
  Page,
} from "@runelay/shared";
import { db } from "@/db/connection";
import {
  deleteMemoryRow,
  describeHealth,
  findMemory,
  insertMemory,
  listMemories,
  listVersions,
  memoryExists,
  updateMemoryRow,
  upsertMemories,
} from "@/modules/memories/repositories/memory.repository";
import { importMemories, importMemoryItems, writeMemory } from "@/modules/memories/services/memory.service";
import { parseLinks } from "@/modules/memories/utils/parse-links";
import { withQueryFault } from "../../../../test/db-fault-helpers";
import { body, call, createApiKey, resetDatabase, signUp, type TestAccount } from "../../../../test/helpers";

let owner: TestAccount;
let stranger: TestAccount;
let ownerKey: string;

const breakQueries = () =>
  spyOn(db, "query").mockImplementation(() => {
    throw new Error("disk on fire");
  });

const create = (account: TestAccount, json: Record<string, unknown>) =>
  call("/v1/memories", { method: "POST", cookie: account.cookie, json });

beforeAll(async () => {
  resetDatabase();
  owner = await signUp("Owner");
  stranger = await signUp("Stranger");
  ownerKey = (await createApiKey(owner)).key;
});

afterEach(() => {
  mock.restore();
});

describe("parseLinks", () => {
  test("extracts unique valid slugs, ignoring aliases, anchors, self and invalid targets", () => {
    const text = "[[alpha]] [[alpha|Alias]] [[beta#section]] [[ gamma ]] [[self]] [[Not Valid]] [[]]";
    expect(parseLinks(text, "self")).toEqual(["alpha", "beta", "gamma"]);
  });
});

describe("memories routes", () => {
  test("requires authentication", async () => {
    const response = await call("/v1/memories");
    expect(response.status).toBe(401);
  });

  test("creates a memory with defaults and resolves links, backlinks and broken links", async () => {
    const target = await create(owner, { slug: "target-note", name: "Target", type: "reference", body: "plain" });
    expect(target.status).toBe(201);
    const response = await create(owner, {
      slug: "source-note",
      name: "Source",
      type: "project",
      body: "See [[target-note]] and [[missing-note]] and [[source-note]]",
    });
    expect(response.status).toBe(201);
    const { data } = await body<MemoryView>(response);
    expect(data.description).toBe("");
    expect(data.pinned).toBe(false);
    expect(data.links).toEqual(["missing-note", "target-note"]);
    expect(data.brokenLinks).toEqual(["missing-note"]);
    expect(data.linkCount).toBe(2);
    const fetched = await body<MemoryView>(await call("/v1/memories/target-note", { bearer: ownerKey }));
    expect(fetched.data.backlinks).toEqual(["source-note"]);
    expect(fetched.data.backlinkCount).toBe(1);
    expect(fetched.data.links).toEqual([]);
  });

  test("rejects duplicate slugs and invalid payloads", async () => {
    const duplicate = await create(owner, { slug: "target-note", name: "Again", type: "user", body: "" });
    expect(duplicate.status).toBe(409);
    expect((await body(duplicate)).error?.code).toBe("ALREADY_EXISTS");
    const invalid = await create(owner, { slug: "Bad Slug", name: "x", type: "user", body: "" });
    expect(invalid.status).toBe(400);
  });

  test("returns MEMORY_NOT_FOUND for unknown slugs", async () => {
    const response = await call("/v1/memories/nope-nope", { cookie: owner.cookie });
    expect(response.status).toBe(404);
    expect((await body(response)).error?.code).toBe("MEMORY_NOT_FOUND");
    const patch = await call("/v1/memories/nope-nope", { method: "PATCH", cookie: owner.cookie, json: { name: "x" } });
    expect(patch.status).toBe(404);
    const removed = await call("/v1/memories/nope-nope", { method: "DELETE", cookie: owner.cookie });
    expect(removed.status).toBe(404);
  });

  test("updates fields, snapshots versions and rewrites links", async () => {
    await create(owner, { slug: "versioned", name: "V1", type: "feedback", body: "[[target-note]]" });
    const first = await call("/v1/memories/versioned", {
      method: "PATCH",
      cookie: owner.cookie,
      json: { name: "V2", body: "now [[source-note]]", pinned: true },
    });
    expect(first.status).toBe(200);
    const updated = (await body<MemoryView>(first)).data;
    expect(updated.name).toBe("V2");
    expect(updated.pinned).toBe(true);
    expect(updated.type).toBe("feedback");
    expect(updated.links).toEqual(["source-note"]);
    await call("/v1/memories/versioned", {
      method: "PATCH",
      cookie: owner.cookie,
      json: { description: "desc", type: "user", pinned: false },
    });
    const after = (await body<MemoryView>(await call("/v1/memories/versioned", { cookie: owner.cookie }))).data;
    expect(after.pinned).toBe(false);
    expect(after.type).toBe("user");
    expect(after.description).toBe("desc");
    const versions = await body<MemoryVersionView[]>(
      await call("/v1/memories/versioned/versions", { cookie: owner.cookie }),
    );
    expect(versions.data.map((version) => version.name)).toEqual(["V2", "V1"]);
    expect(versions.data[1]?.body).toBe("[[target-note]]");
    const empty = await call("/v1/memories/versioned", { method: "PATCH", cookie: owner.cookie, json: {} });
    expect(empty.status).toBe(400);
  });

  test("lists with pagination, filters and full text search", async () => {
    await create(owner, {
      slug: "pinned-zebra",
      name: "Zebra rule",
      type: "feedback",
      body: "unicornflux",
      pinned: true,
    });
    const all = await body<Page<MemoryListItemView>>(await call("/v1/memories?limit=2", { cookie: owner.cookie }));
    expect(all.data.total).toBe(4);
    expect(all.data.items).toHaveLength(2);
    expect(all.data.items[0]?.slug).toBe("pinned-zebra");
    expect(all.data.items[0]?.pinned).toBe(true);
    expect(all.data.nextCursor).toBe(2);
    const last = await body<Page<MemoryListItemView>>(
      await call("/v1/memories?limit=2&cursor=2", { cookie: owner.cookie }),
    );
    expect(last.data.items).toHaveLength(2);
    expect(last.data.nextCursor).toBeNull();
    const pinned = await body<Page<MemoryListItemView>>(
      await call("/v1/memories?pinned=true", { cookie: owner.cookie }),
    );
    expect(pinned.data.items.map((item) => item.slug)).toEqual(["pinned-zebra"]);
    const unpinned = await body<Page<MemoryListItemView>>(
      await call("/v1/memories?pinned=false&type=reference", { cookie: owner.cookie }),
    );
    expect(unpinned.data.items.map((item) => item.slug)).toEqual(["target-note"]);
    const search = await body<Page<MemoryListItemView>>(
      await call("/v1/memories?query=unicornfl", { cookie: owner.cookie }),
    );
    expect(search.data.items.map((item) => item.slug)).toEqual(["pinned-zebra"]);
    expect(search.data.total).toBe(1);
    const punctuation = await body<Page<MemoryListItemView>>(
      await call("/v1/memories?query=!!!", { cookie: owner.cookie }),
    );
    expect(punctuation.data.total).toBe(4);
  });

  test("isolates memories between organizations", async () => {
    const list = await body<Page<MemoryListItemView>>(await call("/v1/memories", { cookie: stranger.cookie }));
    expect(list.data.total).toBe(0);
    const search = await body<Page<MemoryListItemView>>(
      await call("/v1/memories?query=unicornflux", { cookie: stranger.cookie }),
    );
    expect(search.data.total).toBe(0);
    expect((await call("/v1/memories/target-note", { cookie: stranger.cookie })).status).toBe(404);
    const patch = await call("/v1/memories/target-note", {
      method: "PATCH",
      cookie: stranger.cookie,
      json: { name: "hijack" },
    });
    expect(patch.status).toBe(404);
    expect((await call("/v1/memories/target-note", { method: "DELETE", cookie: stranger.cookie })).status).toBe(404);
    const own = await create(stranger, { slug: "target-note", name: "Mine", type: "user", body: "" });
    expect(own.status).toBe(201);
    const original = (await body<MemoryView>(await call("/v1/memories/target-note", { cookie: owner.cookie }))).data;
    expect(original.name).toBe("Target");
  });

  test("reports health: stale, broken links, isolated and total", async () => {
    db.run("UPDATE memories SET updated_at = '2000-01-01T00:00:00.000Z' WHERE organization_id = ? AND slug = ?", [
      owner.organizationId,
      "pinned-zebra",
    ]);
    const response = await call("/v1/memories/health?days=7", { cookie: owner.cookie });
    const { data } = await body<MemoryHealthView>(response);
    expect(data.staleDays).toBe(7);
    expect(data.stale.map((memory) => memory.slug)).toEqual(["pinned-zebra"]);
    expect(data.brokenLinks).toEqual([{ from: "source-note", to: "missing-note" }]);
    expect(data.isolated.map((memory) => memory.slug)).toEqual(["pinned-zebra"]);
    expect(data.total).toBe(4);
    const defaults = await body<MemoryHealthView>(await call("/v1/memories/health", { cookie: owner.cookie }));
    expect(defaults.data.staleDays).toBe(30);
  });

  test("imports memories: inserts new, versions changed and skips unchanged", async () => {
    const payload = {
      memories: [
        { slug: "imported-one", name: "One", type: "project", body: "[[imported-two]]" },
        { slug: "imported-two", name: "Two", type: "user", body: "two" },
      ],
    };
    const first = await call("/v1/memories/import", { method: "POST", cookie: owner.cookie, json: payload });
    expect((await body<{ imported: number }>(first)).data.imported).toBe(2);
    await call("/v1/memories/import", { method: "POST", cookie: owner.cookie, json: payload });
    expect(listVersions(owner.organizationId, "imported-one").data).toEqual([]);
    const changed = {
      memories: [{ slug: "imported-one", name: "One v2", type: "project", body: "changed", pinned: true }],
    };
    await call("/v1/memories/import", { method: "POST", cookie: owner.cookie, json: changed });
    const view = findMemory(owner.organizationId, "imported-one");
    expect(view.data?.name).toBe("One v2");
    expect(view.data?.pinned).toBe(true);
    expect(view.data?.links).toEqual([]);
    expect(listVersions(owner.organizationId, "imported-one").data?.map((version) => version.name)).toEqual(["One"]);
  });

  test("deletes a memory with its links, versions and search rows", async () => {
    const response = await call("/v1/memories/versioned", { method: "DELETE", cookie: owner.cookie });
    expect(response.status).toBe(200);
    expect((await call("/v1/memories/versioned", { cookie: owner.cookie })).status).toBe(404);
    expect(listVersions(owner.organizationId, "versioned").data).toEqual([]);
    const fts = db
      .query<{ total: number }, [string]>(
        "SELECT COUNT(*) AS total FROM memories_fts WHERE organization_id = ? AND slug = 'versioned'",
      )
      .get(owner.organizationId);
    expect(fts?.total).toBe(0);
  });
});

describe("writeMemory", () => {
  test("creates with defaults when missing and updates when present", () => {
    const created = writeMemory(owner.organizationId, { slug: "written-note", body: "first" });
    expect(created.data).toMatchObject({
      slug: "written-note",
      name: "written-note",
      description: "",
      type: "project",
    });
    const updated = writeMemory(owner.organizationId, { slug: "written-note", body: "second", name: "Named" });
    expect(updated.data).toMatchObject({ name: "Named", body: "second", type: "project" });
    const full = writeMemory(owner.organizationId, {
      slug: "written-full",
      body: "b",
      name: "Full",
      description: "d",
      type: "reference",
    });
    expect(full.data).toMatchObject({ name: "Full", description: "d", type: "reference" });
  });

  test("propagates storage failures", () => {
    breakQueries();
    expect(writeMemory(owner.organizationId, { slug: "written-note", body: "x" }).error?.code).toBe("STORAGE_FAILED");
  });
});

describe("push freshness", () => {
  test("skips pushed memories older than the stored copy and imports newer ones", async () => {
    const org = owner.organizationId;
    const base = { name: "Fresh", description: "", type: "project" as const, pinned: false };
    upsertMemories(org, [{ ...base, slug: "fresh-note", body: "server" }]);
    const response = await call("/v1/memories/import", {
      method: "POST",
      cookie: owner.cookie,
      json: {
        memories: [
          { ...base, slug: "fresh-note", body: "stale", updatedAt: "2000-01-01T00:00:00Z" },
          { ...base, slug: "brand-new-note", body: "new", updatedAt: "2000-01-01T00:00:00+02:00" },
        ],
      },
    });
    expect((await body<ImportResultView>(response)).data).toEqual({
      imported: 1,
      written: 1,
      skipped: ["fresh-note"],
      unchanged: [],
    });
    expect(findMemory(org, "fresh-note").data?.body).toBe("server");
    expect(findMemory(org, "brand-new-note").data?.body).toBe("new");
    const newer = upsertMemories(org, [
      { ...base, slug: "fresh-note", body: "local", updatedAt: "2999-01-01T00:00:00Z" },
    ]);
    expect(newer.data).toEqual({ imported: 1, written: 1, skipped: [], unchanged: [] });
    expect(findMemory(org, "fresh-note").data?.body).toBe("local");
  });

  test("reports identical memories as unchanged without writing, even when the server is newer", () => {
    const org = owner.organizationId;
    const memory = {
      slug: "same-note",
      name: "Same",
      description: "d",
      type: "project" as const,
      body: "body",
      pinned: false,
    };
    upsertMemories(org, [memory]);
    db.query("UPDATE memories SET updated_at = '2999-01-01T00:00:00.000Z' WHERE organization_id = ? AND slug = ?").run(
      org,
      "same-note",
    );
    const identical = upsertMemories(org, [
      { ...memory, updatedAt: "2000-01-01T00:00:00Z" },
      { ...memory, slug: "other-note" },
    ]);
    expect(identical.data).toEqual({ imported: 2, written: 1, skipped: [], unchanged: ["same-note"] });
    expect(findMemory(org, "same-note").data?.updatedAt).toBe("2999-01-01T00:00:00.000Z");
    const again = upsertMemories(org, [memory, { ...memory, slug: "other-note" }]);
    expect(again.data).toEqual({ imported: 2, written: 0, skipped: [], unchanged: ["same-note", "other-note"] });
    const variants = [
      { ...memory, name: "Renamed" },
      { ...memory, description: "other" },
      { ...memory, type: "user" as const },
      { ...memory, body: "other" },
      { ...memory, pinned: true },
    ];
    for (const variant of variants) {
      expect(upsertMemories(org, [{ ...variant, updatedAt: "2000-01-01T00:00:00Z" }]).data).toEqual({
        imported: 0,
        written: 0,
        skipped: ["same-note"],
        unchanged: [],
      });
    }
    const changed = upsertMemories(org, [{ ...memory, body: "changed", updatedAt: "2999-06-01T00:00:00Z" }]);
    expect(changed.data).toEqual({ imported: 1, written: 1, skipped: [], unchanged: [] });
    expect(findMemory(org, "same-note").data?.body).toBe("changed");
    expect(listVersions(org, "same-note").data?.map((version) => version.body)).toEqual(["body"]);
  });

  test("rejects an invalid updatedAt", async () => {
    const response = await call("/v1/memories/import", {
      method: "POST",
      cookie: owner.cookie,
      json: { memories: [{ slug: "bad-date", name: "B", type: "user", body: "", updatedAt: "yesterday" }] },
    });
    expect(response.status).toBe(400);
  });
});

describe("duplicate hints", () => {
  test("lists similar memories only when creating a new slug", () => {
    const org = owner.organizationId;
    writeMemory(org, { slug: "quokka-deploy-rules", name: "Quokka deploy rules", body: "never on friday" });
    const created = writeMemory(org, { slug: "quokka-deploy-policy", name: "Quokka deploy policy", body: "x" });
    expect(created.data?.similar?.[0]).toEqual({ slug: "quokka-deploy-rules", name: "Quokka deploy rules" });
    expect(created.data?.similar?.length).toBeLessThanOrEqual(3);
    expect(created.data?.hint).toContain("write_memory");
    const updated = writeMemory(org, { slug: "quokka-deploy-policy", body: "y" });
    expect(updated.data?.similar).toBeUndefined();
    const short = writeMemory(org, { slug: "tiny-words", name: "a b", body: "z" });
    expect(short.data?.similar).toBeUndefined();
    expect(short.data?.hint).toBeUndefined();
  });
});

describe("importMemoryItems", () => {
  test("creates, updates, skips and reports invalid items without aborting", () => {
    const org = owner.organizationId;
    const first = importMemoryItems(org, [
      { slug: "wombat-intake", name: "Wombat intake", body: "one", createdAt: "2020-05-01T10:00:00+02:00" },
      { slug: "wombat-intake-form", name: "Wombat intake form", body: "two" },
      { slug: "Bad Slug", body: "x" },
    ]);
    expect(first).toMatchObject({ created: 2, updated: 0, skipped: 0, failed: 1 });
    expect(first.items[0]).toMatchObject({ slug: "wombat-intake", status: "created" });
    expect(first.items[1]?.similar?.[0]).toEqual({ slug: "wombat-intake", name: "Wombat intake" });
    expect(first.items[2]).toMatchObject({ slug: "Bad Slug", status: "failed" });
    expect(first.items[2]?.error).toBeTruthy();
    expect(first.hint).toContain("write_memory");
    expect(findMemory(org, "wombat-intake").data?.createdAt).toBe("2020-05-01T08:00:00.000Z");
    const second = importMemoryItems(org, [
      { slug: "wombat-intake", body: "one" },
      { slug: "wombat-intake-form", body: "changed" },
    ]);
    expect(second).toMatchObject({ created: 0, updated: 1, skipped: 1, failed: 0 });
    expect(second.items.map((item) => item.status)).toEqual(["skipped", "updated"]);
    expect(second.hint).toBeUndefined();
    expect(findMemory(org, "wombat-intake-form").data?.body).toBe("changed");
    expect(listVersions(org, "wombat-intake-form").data?.map((version) => version.body)).toEqual(["two"]);
  });

  test("reports storage failures per item", () => {
    const org = owner.organizationId;
    const lookup = withQueryFault(
      (sql) => sql.includes("json_group_array(to_slug)"),
      () => importMemoryItems(org, [{ slug: "wombat-lookup", body: "x" }]),
    );
    expect(lookup.items[0]).toMatchObject({ slug: "wombat-lookup", status: "failed" });
    const insert = withQueryFault(
      (sql) => sql.startsWith("INSERT INTO memories ("),
      () => importMemoryItems(org, [{ slug: "wombat-insert", body: "x" }]),
    );
    expect(insert).toMatchObject({ failed: 1, items: [{ slug: "wombat-insert", status: "failed" }] });
    expect(memoryExists(org, "wombat-insert").data).toBe(false);
  });
});

describe("storage failures", () => {
  test("every repository function returns STORAGE_FAILED", async () => {
    const org = owner.organizationId;
    breakQueries();
    const results = [
      listMemories(org, { cursor: 0, limit: 10 }),
      findMemory(org, "target-note"),
      memoryExists(org, "target-note"),
      insertMemory(org, { slug: "boom", name: "b", description: "", type: "user", body: "", pinned: false }),
      updateMemoryRow(org, "target-note", { name: "b" }),
      deleteMemoryRow(org, "target-note"),
      listVersions(org, "target-note"),
      describeHealth(org, 30),
      upsertMemories(org, [{ slug: "boom", name: "b", description: "", type: "user", body: "", pinned: false }]),
      importMemories(org, { memories: [] }),
    ];
    for (const result of results) expect(result.error?.code).toBe("STORAGE_FAILED");
  });

  test("services surface STORAGE_FAILED from create and update", async () => {
    const memoryService = await import("@/modules/memories/services/memory.service");
    breakQueries();
    expect(
      memoryService.createMemory(owner.organizationId, {
        slug: "boom",
        name: "b",
        description: "",
        type: "user",
        body: "",
        pinned: false,
      }).error?.code,
    ).toBe("STORAGE_FAILED");
    expect(memoryService.updateMemory(owner.organizationId, "target-note", { name: "b" }).error?.code).toBe(
      "STORAGE_FAILED",
    );
  });
});
