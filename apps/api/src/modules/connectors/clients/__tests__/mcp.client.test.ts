import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { env } from "@/config/env";
import { connectMcpRemote, connectStdio } from "@/modules/connectors/clients/mcp.client";
import type { Connection } from "@/modules/connectors/types/connector.types";
import { startMcpUpstream } from "../../../../../test/gateway-helpers";

const upstream = startMcpUpstream();
const key = { organizationId: "org-mcp-client", name: "upstream" };
const previousAllowPrivate = env.RUNELAY_ALLOW_PRIVATE_URLS;
const fixture = join(import.meta.dir, "../../../../../test/fixtures/mcp-stdio-server.ts");

const remote = (path: string, headers: Record<string, string> = {}) =>
  connectMcpRemote(key, { kind: "mcp", url: upstream.url(path), headers });

const callOf = (connection: Connection, name: string) => {
  const tool = connection.tools.find((candidate) => candidate.name === name);
  if (!tool) throw new Error(`missing ${name}`);
  return tool.call;
};

let connection: Connection;

beforeAll(async () => {
  env.RUNELAY_ALLOW_PRIVATE_URLS = true;
  const connected = await remote("/mcp", { "x-upstream": "yes" });
  if (connected.error) throw new Error(connected.error.message);
  connection = connected.data;
});

afterAll(async () => {
  await connection.close();
  env.RUNELAY_ALLOW_PRIVATE_URLS = previousAllowPrivate;
  upstream.server.stop(true);
});

describe("connectMcpRemote", () => {
  test("loads every page of tools and forwards configured headers", () => {
    expect(connection.tools.map((tool) => tool.name)).toEqual([
      "echo",
      "structured",
      "failing",
      "failing_silent",
      "image",
      "plain",
      "multi",
      "throws",
    ]);
    expect(connection.tools.find((tool) => tool.name === "throws")?.description).toBe("");
    expect(connection.tools.every((tool) => tool.source === "upstream")).toBe(true);
    expect(upstream.seenHeaders.some((headers) => headers["x-upstream"] === "yes")).toBe(true);
  });

  test("unwraps each kind of tool result", async () => {
    expect(await callOf(connection, "echo")({ a: 1 })).toEqual({ data: { a: 1 }, error: null });
    expect(await callOf(connection, "structured")({})).toEqual({ data: { value: 1 }, error: null });
    expect(await callOf(connection, "plain")({})).toEqual({ data: "not json", error: null });
    expect((await callOf(connection, "image")({})).data).toEqual([
      { type: "image", data: "aGk=", mimeType: "image/png" },
    ]);
    expect((await callOf(connection, "multi")({})).data).toHaveLength(2);
  });

  test("maps tool errors and protocol errors to TOOL_FAILED", async () => {
    const failing = await callOf(connection, "failing")({});
    expect(failing.error).toMatchObject({ code: "TOOL_FAILED", message: "upstream exploded" });
    const silent = await callOf(connection, "failing_silent")({});
    expect(silent.error?.code).toBe("TOOL_FAILED");
    const thrown = await callOf(connection, "throws")({});
    expect(thrown.error?.code).toBe("TOOL_FAILED");
    expect(thrown.error?.message).toContain("no handler for throws");
  });

  test("returns NEEDS_AUTH when the streamable endpoint asks for OAuth", async () => {
    const result = await remote("/locked");
    expect(result.error?.code).toBe("NEEDS_AUTH");
  });

  test("returns NEEDS_AUTH when only the SSE fallback asks for OAuth", async () => {
    const result = await remote("/sse-locked");
    expect(result.error?.code).toBe("NEEDS_AUTH");
  });

  test("returns CONNECTION_FAILED with the streamable error when both transports fail", async () => {
    const result = await remote("/nowhere");
    expect(result.error?.code).toBe("CONNECTION_FAILED");
    expect(result.error?.message).toContain("Streamable HTTP error");
  });
});

describe("connectStdio", () => {
  test("spawns a local server and calls its tools", async () => {
    const connected = await connectStdio(
      { organizationId: "org-mcp-client", name: "local" },
      { kind: "stdio", command: process.execPath, args: [fixture], env: { FIXTURE: "1" } },
    );
    if (connected.error) throw new Error(connected.error.message);
    expect(connected.data.tools.map((tool) => `${tool.source}.${tool.name}`)).toEqual(["local.shout"]);
    expect(await callOf(connected.data, "shout")({ text: "hi" })).toEqual({ data: { shouted: "HI" }, error: null });
    await connected.data.close();
  });

  test("fails with CONNECTION_FAILED when the command does not exist", async () => {
    const result = await connectStdio(
      { organizationId: "org-mcp-client", name: "missing" },
      { kind: "stdio", command: "/nonexistent/runelay-command", args: [], env: {} },
    );
    expect(result.error?.code).toBe("CONNECTION_FAILED");
  });
});
