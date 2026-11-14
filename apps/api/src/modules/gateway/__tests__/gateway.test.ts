import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { env } from "@/config/env";
import { db } from "@/db/connection";
import {
  connectGateway,
  OPENAPI_BULK_COUNT,
  openApiSpec,
  startMcpUpstream,
  startOpenApiUpstream,
  textOf,
} from "../../../../test/gateway-helpers";
import { body, call, createApiKey, resetDatabase, signUp, type TestAccount } from "../../../../test/helpers";

const mcpUpstream = startMcpUpstream();
const openApiUpstream = startOpenApiUpstream();
const previousAllowPrivate = env.RUNELAY_ALLOW_PRIVATE_URLS;
const previousEnableExecute = env.RUNELAY_ENABLE_EXECUTE;

let account: TestAccount;
let apiKey: { id: string; key: string };
let gateway: Client;

const createSource = async (name: string, config: Record<string, unknown>) => {
  const response = await call("/v1/sources", { method: "POST", cookie: account.cookie, json: { name, config } });
  expect(response.status).toBe(201);
  return body<{ status: string }>(response);
};

const callGateway = async (name: string, args: Record<string, unknown> = {}) => {
  const result = await gateway.callTool({ name, arguments: args });
  const text = textOf(result);
  return { isError: result.isError === true, text, json: () => JSON.parse(text) as unknown };
};

beforeAll(async () => {
  env.RUNELAY_ALLOW_PRIVATE_URLS = true;
  env.RUNELAY_ENABLE_EXECUTE = true;
  resetDatabase();
  account = await signUp("Gateway");
  apiKey = await createApiKey(account, "gateway");
  const shop = await createSource("shop", {
    kind: "openapi",
    spec: JSON.stringify(openApiSpec()),
    baseUrl: openApiUpstream.url(""),
  });
  expect(shop.data.status).toBe("ok");
  const remote = await createSource("remote", { kind: "mcp", url: mcpUpstream.url("/mcp") });
  expect(remote.data.status).toBe("ok");
  gateway = await connectGateway(apiKey.key);
});

afterEach(() => {
  env.RUNELAY_ENABLE_EXECUTE = true;
});

afterAll(async () => {
  await gateway.close();
  env.RUNELAY_ALLOW_PRIVATE_URLS = previousAllowPrivate;
  env.RUNELAY_ENABLE_EXECUTE = previousEnableExecute;
  mcpUpstream.server.stop(true);
  openApiUpstream.server.stop(true);
});

describe("gateway route", () => {
  test("rejects requests without credentials", async () => {
    const response = await call("/v1/mcp", { method: "POST", json: { jsonrpc: "2.0", id: 1, method: "tools/list" } });
    expect(response.status).toBe(401);
  });

  test("exposes the gateway tools and instructions", async () => {
    const { tools } = await gateway.listTools();
    expect(tools.map((tool) => tool.name)).toEqual([
      "list_connections",
      "search_tools",
      "call_tool",
      "execute",
      "search_context",
      "read_memory",
      "write_memory",
      "read_skill",
      "read_skill_file",
    ]);
    expect(gateway.getInstructions()).toContain("runelay aggregates every account");
  });

  test("hides execute when it is disabled", async () => {
    env.RUNELAY_ENABLE_EXECUTE = false;
    const client = await connectGateway(apiKey.key);
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name)).not.toContain("execute");
    const result = await client.callTool({ name: "execute", arguments: { code: "return 1;" } });
    expect(result.isError).toBe(true);
    await client.close();
  });
});

describe("list_connections", () => {
  test("lists sources with redacted config", async () => {
    const result = await callGateway("list_connections");
    expect(result.isError).toBe(false);
    const views = result.json() as { name: string; status: string }[];
    expect(views.map((view) => view.name).sort()).toEqual(["remote", "shop"]);
    expect(views.every((view) => view.status === "ok")).toBe(true);
  });
});

describe("search_tools", () => {
  test("lists every tool with summaries when the query is empty", async () => {
    const tools = (await callGateway("search_tools")).json() as { name: string; inputSchema?: unknown }[];
    expect(tools).toHaveLength(6 + OPENAPI_BULK_COUNT + 8);
    expect(tools.every((tool) => tool.inputSchema === undefined)).toBe(true);
  });

  test("ranks matches and returns full schemas for few results", async () => {
    const tools = (await callGateway("search_tools", { query: "echo arguments" })).json() as {
      name: string;
      description: string;
      inputSchema?: unknown;
    }[];
    expect(tools[0]).toMatchObject({ name: "remote.echo", description: "Echo the arguments back" });
    expect(tools[0]?.inputSchema).toBeDefined();
  });

  test("truncates descriptions when many tools match", async () => {
    const tools = (await callGateway("search_tools", { query: "bulk widget" })).json() as {
      description: string;
      inputSchema?: unknown;
    }[];
    expect(tools).toHaveLength(OPENAPI_BULK_COUNT);
    expect(tools.every((tool) => tool.description.length === 160 && tool.inputSchema === undefined)).toBe(true);
  });

  test("filters by source and limit", async () => {
    const tools = (await callGateway("search_tools", { source: "remote", limit: 2 })).json() as { name: string }[];
    expect(tools.map((tool) => tool.name)).toEqual(["remote.echo", "remote.structured"]);
    const none = (await callGateway("search_tools", { query: "zzz-nothing" })).json();
    expect(none).toEqual([]);
  });
});

describe("call_tool", () => {
  test("calls a tool and records the activity", async () => {
    const result = await callGateway("call_tool", { name: "remote.echo", args: { hello: "world" } });
    expect(result.isError).toBe(false);
    expect(result.json()).toEqual({ hello: "world" });
    const row = db
      .query<{ ok: number; api_key_id: string | null }, [string]>(
        "SELECT ok, api_key_id FROM tool_calls WHERE organization_id = ? AND tool = 'echo' LIMIT 1",
      )
      .get(account.organizationId);
    expect(row).toEqual({ ok: 1, api_key_id: apiKey.id });
  });

  test("calls a tool without args", async () => {
    const result = await callGateway("call_tool", { name: "shop.getText" });
    expect(result.text).toBe("plain body");
  });

  test("returns tool failures as errors", async () => {
    const failed = await callGateway("call_tool", { name: "remote.failing" });
    expect(failed.isError).toBe(true);
    expect(failed.json()).toMatchObject({ error: { code: "TOOL_FAILED", message: "upstream exploded" } });
  });

  test("returns an error for an unknown tool", async () => {
    const missing = await callGateway("call_tool", { name: "remote.nope" });
    expect(missing.isError).toBe(true);
    expect(missing.json()).toMatchObject({ error: { code: "TOOL_NOT_FOUND" } });
  });
});

describe("execute", () => {
  test("chains tools across sources", async () => {
    const result = await callGateway("execute", {
      code: `
        const echoed = await tools.remote.echo({ n: 2 });
        const fetched = await tools.shop.getItem({ id: "x" });
        console.log("done");
        return { n: echoed.data.n, path: fetched.data.path };
      `,
    });
    expect(result.isError).toBe(false);
    expect(result.json()).toEqual({ result: { n: 2, path: "/items/x" }, logs: ["done"] });
  });

  test("returns sandbox failures as errors", async () => {
    const result = await callGateway("execute", { code: "throw new Error('nope');" });
    expect(result.isError).toBe(true);
    expect(result.json()).toMatchObject({ error: { code: "EXECUTE_FAILED", message: "Error: nope" } });
  });
});

describe("context tools", () => {
  test("writes, reads and searches a memory", async () => {
    const written = await callGateway("write_memory", {
      slug: "gateway-fact",
      body: "The gateway answers zebra questions.",
      name: "Gateway fact",
    });
    expect(written.isError).toBe(false);
    const read = await callGateway("read_memory", { slug: "gateway-fact" });
    expect(read.text).toContain("zebra");
    const found = await callGateway("search_context", { query: "zebra" });
    expect(found.text).toContain("gateway-fact");
  });

  test("reports missing skills and skill files", async () => {
    const skill = await callGateway("read_skill", { slug: "no-such-skill" });
    expect(skill.isError).toBe(true);
    const file = await callGateway("read_skill_file", { slug: "no-such-skill", path: "a.md" });
    expect(file.isError).toBe(true);
  });
});
