import { afterEach, beforeAll, describe, expect, mock, spyOn, test } from "bun:test";
import type { MemoryHealthView, MemoryListItemView, MemoryVersionView, MemoryView, Page } from "@runelay/shared";
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
import { importMemories, writeMemory } from "@/modules/memories/services/memory.service";
import { parseLinks } from "@/modules/memories/utils/parse-links";
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
