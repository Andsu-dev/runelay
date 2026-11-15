import { UnauthorizedError } from "@modelcontextprotocol/sdk/client/auth.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { attempt, errorMessage, fail, type McpRemoteConfig, ok, type Result, type StdioConfig } from "@runelay/shared";
import { CLIENT_INFO } from "@/modules/connectors/constants/connector.constants";
import type { Connection, Tool } from "@/modules/connectors/types/connector.types";
import { createOAuthFetch, createOAuthProvider } from "@/modules/oauth/providers/oauth-client.provider";
import type { SourceKey } from "@/modules/sources/types/source.types";

const unwrapToolResult = (result: CallToolResult): Result<unknown> => {
  const text = result.content.flatMap((part) => (part.type === "text" ? [part.text] : [])).join("\n");
  if (result.isError) return fail("TOOL_FAILED", text || undefined);
  if (result.structuredContent) return ok(result.structuredContent);
  if (result.content.length !== 1 || result.content[0]?.type !== "text") return ok(result.content);
  try {
    return ok(JSON.parse(text));
  } catch {
    return ok(text);
  }
};

const loadConnection = async (client: Client, source: string): Promise<Result<Connection>> =>
  attempt(async () => {
    const tools: Tool[] = [];
    let cursor: string | undefined;
    do {
      const page = await client.listTools({ cursor });
      for (const tool of page.tools) {
        tools.push({
          name: tool.name,
          source,
          description: tool.description ?? "",
          inputSchema: tool.inputSchema,
          call: async (args) => {
            const called = await attempt(
              () => client.callTool({ name: tool.name, arguments: args }) as Promise<CallToolResult>,
              "TOOL_FAILED",
            );
            return called.error ? called : unwrapToolResult(called.data);
          },
        });
      }
      cursor = page.nextCursor;
    } while (cursor);
    return { tools, close: () => client.close() };
  }, "CONNECTION_FAILED");

export const connectMcpRemote = async (key: SourceKey, config: McpRemoteConfig): Promise<Result<Connection>> => {
  const url = new URL(config.url);
  const options = {
    authProvider: createOAuthProvider(key),
    requestInit: { headers: config.headers },
    fetch: createOAuthFetch(key),
  };
  const client = new Client(CLIENT_INFO);
  try {
    await client.connect(new StreamableHTTPClientTransport(url, options));
  } catch (streamableError) {
    if (streamableError instanceof UnauthorizedError) return fail("NEEDS_AUTH");
    try {
      await client.connect(new SSEClientTransport(url, options));
    } catch (sseError) {
      if (sseError instanceof UnauthorizedError) return fail("NEEDS_AUTH");
      return fail("CONNECTION_FAILED", errorMessage(streamableError));
    }
  }
  return loadConnection(client, key.name);
};

export const connectStdio = async ({ name }: SourceKey, config: StdioConfig): Promise<Result<Connection>> => {
  const client = new Client(CLIENT_INFO);
  const transport = new StdioClientTransport({
    command: config.command,
    args: config.args,
    env: { PATH: process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin", HOME: process.env.HOME ?? "/tmp", ...config.env },
    stderr: "ignore",
  });
  const connected = await attempt(() => client.connect(transport), "CONNECTION_FAILED");
  if (connected.error) return connected;
  return loadConnection(client, name);
};
