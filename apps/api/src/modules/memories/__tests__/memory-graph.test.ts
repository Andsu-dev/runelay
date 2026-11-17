import { afterEach, beforeAll, describe, expect, mock, spyOn, test } from "bun:test";
import type { MemoryGraphView } from "@runelay/shared";
import { db } from "@/db/connection";
import { describeGraph } from "@/modules/memories/repositories/memory.repository";
import { body, call, createApiKey, resetDatabase, signUp, type TestAccount } from "../../../../test/helpers";

let owner: TestAccount;
let stranger: TestAccount;
let ownerKey: string;

const create = (account: TestAccount, json: Record<string, unknown>) =>
  call("/v1/memories", { method: "POST", cookie: account.cookie, json });

beforeAll(async () => {
  resetDatabase();
  owner = await signUp("Graph Owner");
  stranger = await signUp("Graph Stranger");
  ownerKey = (await createApiKey(owner)).key;
  await create(owner, { slug: "hub", name: "Hub", type: "project", body: "[[leaf-a]] [[leaf-b]] [[ghost]]" });
  await create(owner, { slug: "leaf-a", name: "Leaf A", type: "reference", body: "[[hub]]", pinned: true });
  await create(owner, { slug: "leaf-b", name: "Leaf B", type: "user", body: "plain" });
  await create(owner, { slug: "lonely", name: "Lonely", type: "feedback", body: "" });
  await create(stranger, { slug: "hub", name: "Other hub", type: "project", body: "[[secret]]" });
  await create(stranger, { slug: "secret", name: "Secret", type: "project", body: "" });
});

afterEach(() => {
  mock.restore();
});

describe("memory graph route", () => {
  test("requires authentication", async () => {
    expect((await call("/v1/memories/graph")).status).toBe(401);
  });

  test("returns every memory as a node and only edges whose both ends exist", async () => {
    const response = await call("/v1/memories/graph", { bearer: ownerKey });
    expect(response.status).toBe(200);
    const { data } = await body<MemoryGraphView>(response);
    expect(data.nodes).toEqual([
      { slug: "hub", name: "Hub", type: "project", pinned: false, degree: 3 },
      { slug: "leaf-a", name: "Leaf A", type: "reference", pinned: true, degree: 2 },
      { slug: "leaf-b", name: "Leaf B", type: "user", pinned: false, degree: 1 },
      { slug: "lonely", name: "Lonely", type: "feedback", pinned: false, degree: 0 },
    ]);
    expect(data.edges).toEqual([
      { source: "hub", target: "leaf-a" },
      { source: "hub", target: "leaf-b" },
      { source: "leaf-a", target: "hub" },
    ]);
  });

  test("isolates the graph between organizations", async () => {
    const { data } = await body<MemoryGraphView>(await call("/v1/memories/graph", { cookie: stranger.cookie }));
    expect(data.nodes.map((node) => node.slug)).toEqual(["hub", "secret"]);
    expect(data.edges).toEqual([{ source: "hub", target: "secret" }]);
  });

  test("drops edges when a linked memory is deleted", async () => {
    await call("/v1/memories/leaf-b", { method: "DELETE", cookie: owner.cookie });
    const { data } = await body<MemoryGraphView>(await call("/v1/memories/graph", { cookie: owner.cookie }));
    expect(data.edges).toEqual([
      { source: "hub", target: "leaf-a" },
      { source: "leaf-a", target: "hub" },
    ]);
    expect(data.nodes.find((node) => node.slug === "hub")?.degree).toBe(2);
  });

  test("returns STORAGE_FAILED when the database fails", () => {
    spyOn(db, "query").mockImplementation(() => {
      throw new Error("disk on fire");
    });
    expect(describeGraph(owner.organizationId).error?.code).toBe("STORAGE_FAILED");
  });
});
