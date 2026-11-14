import { afterAll, beforeAll, expect, spyOn, test } from "bun:test";
import { ok } from "@runelay/shared";
import * as openapiClient from "@/modules/connectors/clients/openapi.client";
import {
  connectSource,
  disconnectSource,
  findTool,
  listLiveTools,
} from "@/modules/connectors/services/connection.service";
import { updateEnabled, upsertSource } from "@/modules/sources/repositories/source.repository";
import { signUp, type TestAccount } from "../../../../../test/helpers";
import { closedUrl, type FakeMcpServer, INLINE_SPEC, startFakeMcp, withEnv } from "../../../../../test/sources-helpers";

let account: TestAccount;
let server: FakeMcpServer;
let locked: FakeMcpServer;
let restore: () => void;

const key = (name: string) => ({ organizationId: account.organizationId, name });

beforeAll(async () => {
  restore = withEnv("RUNELAY_ALLOW_PRIVATE_URLS", true);
  account = await signUp("Connections");
  server = startFakeMcp();
  locked = startFakeMcp({ requireToken: true });
  upsertSource(account.organizationId, { name: "remote", config: { kind: "mcp", url: server.mcpUrl, headers: {} } });
  upsertSource(account.organizationId, {
    name: "api",
    config: { kind: "openapi", spec: INLINE_SPEC, baseUrl: null, headers: {}, query: {} },
  });
  upsertSource(account.organizationId, { name: "locked", config: { kind: "mcp", url: locked.mcpUrl, headers: {} } });
  upsertSource(account.organizationId, { name: "off", config: { kind: "mcp", url: closedUrl(), headers: {} } });
  updateEnabled(key("off"), false);
});

afterAll(() => {
  restore();
  server.stop();
  locked.stop();
});

test("lists tools of enabled sources, connecting lazily and skipping sources that need auth", async () => {
  const first = await connectSource(key("locked"));
  expect(first.error?.code).toBe("NEEDS_AUTH");
  const tools = await listLiveTools(account.organizationId);
  expect(tools.data?.map((tool) => `${tool.source}.${tool.name}`).sort()).toEqual(["api.ping", "remote.echo"]);
  const again = await listLiveTools(account.organizationId);
  expect(again.data).toHaveLength(2);
});

test("finds a live tool and calls it", async () => {
  const tool = await findTool(account.organizationId, "remote.echo");
  expect(tool.data?.name).toBe("echo");
  const result = await tool.data?.call({ text: "oi" });
  expect(result?.data).toBe("oi");
});

test("connects on demand when the tool source is not live", async () => {
  await disconnectSource(key("api"));
  const tool = await findTool(account.organizationId, "api.ping");
  expect(tool.data?.source).toBe("api");
});

test("rejects names without a source prefix", async () => {
  expect((await findTool(account.organizationId, "echo")).error?.code).toBe("TOOL_NOT_FOUND");
  expect((await findTool(account.organizationId, ".echo")).error?.code).toBe("TOOL_NOT_FOUND");
});

test("reports unknown tools on a live source", async () => {
  const result = await findTool(account.organizationId, "remote.missing");
  expect(result.error?.message).toContain("remote.missing");
});

test("fails when the source cannot connect", async () => {
  expect((await findTool(account.organizationId, "ghost.tool")).error?.code).toBe("SOURCE_NOT_FOUND");
  expect((await findTool(account.organizationId, "off.tool")).error?.code).toBe("CONNECTION_FAILED");
});

test("ignores errors while closing a connection", async () => {
  const spy = spyOn(openapiClient, "connectOpenApi").mockImplementation(async () =>
    ok({ tools: [], close: () => Promise.reject(new Error("close failed")) }),
  );
  try {
    expect((await connectSource(key("api"))).error).toBeNull();
    await disconnectSource(key("api"));
  } finally {
    spy.mockRestore();
  }
});
