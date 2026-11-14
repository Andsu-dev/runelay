import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { env } from "@/config/env";
import { connectOpenApi } from "@/modules/connectors/clients/openapi.client";
import type { Connection } from "@/modules/connectors/types/connector.types";
import { OPENAPI_BULK_COUNT, openApiSpec, startOpenApiUpstream } from "../../../../../test/gateway-helpers";

const upstream = startOpenApiUpstream();
const key = { organizationId: "org-openapi", name: "shop" };
const previousAllowPrivate = env.RUNELAY_ALLOW_PRIVATE_URLS;

const config = (overrides: Partial<Parameters<typeof connectOpenApi>[1]> = {}) => ({
  kind: "openapi" as const,
  spec: JSON.stringify(openApiSpec()),
  baseUrl: upstream.url("/"),
  headers: { authorization: "Bearer secret" },
  query: { api_key: "k" },
  ...overrides,
});

const connect = async (overrides: Partial<Parameters<typeof connectOpenApi>[1]> = {}): Promise<Connection> => {
  const result = await connectOpenApi(key, config(overrides));
  if (result.error) throw new Error(result.error.message);
  return result.data;
};

const toolOf = (connection: Connection, name: string) => {
  const tool = connection.tools.find((candidate) => candidate.name === name);
  if (!tool) throw new Error(`missing ${name}`);
  return tool;
};

beforeAll(() => {
  env.RUNELAY_ALLOW_PRIVATE_URLS = true;
});

afterAll(() => {
  env.RUNELAY_ALLOW_PRIVATE_URLS = previousAllowPrivate;
  upstream.server.stop(true);
});

describe("connectOpenApi", () => {
  test("builds one tool per operation with names, descriptions and schemas", async () => {
    const connection = await connect();
    expect(connection.tools).toHaveLength(6 + OPENAPI_BULK_COUNT);
    expect(connection.tools.every((tool) => tool.source === "shop")).toBe(true);
    const getItem = toolOf(connection, "getItem");
    expect(getItem.description).toBe("Get one item\n\nReads an item by id");
    expect(getItem.inputSchema).toEqual({
      type: "object",
      properties: {
        id: { type: "string", description: undefined },
        expand: { type: "object", description: undefined },
        "x-trace": { type: "string", description: undefined },
        verbose: { type: "string", description: undefined },
      },
      required: ["id"],
    });
    expect(toolOf(connection, "create_item").inputSchema).toEqual({
      type: "object",
      properties: { body: { type: "object", properties: { title: { type: "string" } } } },
      required: ["body"],
    });
    const put = toolOf(connection, "put__items");
    expect(put.description).toBe("PUT /items");
    expect(put.inputSchema).toEqual({ type: "object", properties: { body: { type: "object" } }, required: [] });
    await connection.close();
  });

  test("sends path, query, header and body arguments", async () => {
    const connection = await connect();
    const fetched = await toolOf(connection, "getItem").call({
      id: "a b",
      expand: { deep: true },
      "x-trace": 7,
      verbose: undefined,
    });
    expect(fetched.error).toBeNull();
    expect(fetched.data).toMatchObject({ method: "GET", path: "/items/a%20b" });
    const request = upstream.requests.at(-1);
    const url = new URL(request?.url ?? "");
    expect(url.searchParams.get("api_key")).toBe("k");
    expect(url.searchParams.get("expand")).toBe('{"deep":true}');
    expect(url.searchParams.has("verbose")).toBe(false);
    expect(request?.headers.get("x-trace")).toBe("7");
    expect(request?.headers.get("authorization")).toBe("Bearer secret");

    const created = await toolOf(connection, "create_item").call({ body: { title: "hi" } });
    expect(created.data).toMatchObject({ method: "POST", path: "/items" });
    expect(upstream.requests.at(-1)?.body).toBe('{"title":"hi"}');
    expect(upstream.requests.at(-1)?.headers.get("content-type")).toBe("application/json");
  });

  test("returns non JSON bodies as text and failures with a status", async () => {
    const connection = await connect();
    expect(await toolOf(connection, "getText").call({})).toEqual({ data: "plain body", error: null });
    const jsonFailure = await toolOf(connection, "failJson").call({});
    expect(jsonFailure.error).toMatchObject({ code: "TOOL_FAILED", message: '500 {"reason":"broken"}' });
    const textFailure = await toolOf(connection, "failText").call({});
    expect(textFailure.error).toMatchObject({ code: "TOOL_FAILED", message: "404 missing" });
  });

  test("reports a fetch failure as TOOL_FAILED", async () => {
    const connection = await connect({ baseUrl: "ftp://127.0.0.1" });
    const result = await toolOf(connection, "getText").call({});
    expect(result.error?.code).toBe("TOOL_FAILED");
    expect(result.error?.message).toContain("ftp:");
  });

  test("loads a JSON spec by URL and resolves a relative server", async () => {
    const connection = await connect({ spec: upstream.url("/spec.json"), baseUrl: null });
    const result = await toolOf(connection, "getText").call({});
    expect(result.data).toBe("plain body");
    expect(upstream.requests.at(-1)?.url).toStartWith(upstream.url("/api/text"));
  });

  test("loads a swagger 2 YAML spec and builds the base url from host", async () => {
    const connection = await connect({ spec: upstream.url("/spec.yaml"), baseUrl: null, query: {} });
    const result = await toolOf(connection, "ping").call({});
    expect(result.data).toMatchObject({ path: "/v2/ping" });
  });

  test("defaults to https for a host without schemes and to empty without servers", async () => {
    const withHost = await connect({ spec: JSON.stringify({ host: "api.example.test", paths: {} }), baseUrl: null });
    expect(withHost.tools).toEqual([]);
    const bare = await connect({ spec: "paths:\n  /x:\n    get: {}\n", baseUrl: null });
    expect(bare.tools.map((tool) => tool.name)).toEqual(["get__x"]);
    const empty = await connect({ spec: "{}", baseUrl: null });
    expect(empty.tools).toEqual([]);
  });

  test("fails with CONNECTION_FAILED when the spec cannot be parsed", async () => {
    const result = await connectOpenApi(key, config({ spec: "{ not json" }));
    expect(result.error?.code).toBe("CONNECTION_FAILED");
  });
});
