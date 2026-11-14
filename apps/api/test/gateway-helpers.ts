import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import {
  CallToolRequestSchema,
  type CallToolResult,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { app } from "@/app";

const objectSchema = { type: "object" as const, properties: {} };

const UPSTREAM_PAGES: Tool[][] = [
  [
    { name: "echo", description: "Echo the arguments back", inputSchema: objectSchema },
    { name: "structured", description: "Return structured content", inputSchema: objectSchema },
  ],
  [
    { name: "failing", description: "Always fails", inputSchema: objectSchema },
    { name: "failing_silent", description: "Fails without text", inputSchema: objectSchema },
    { name: "image", description: "Returns an image", inputSchema: objectSchema },
    { name: "plain", description: "Returns plain text", inputSchema: objectSchema },
    { name: "multi", description: "Returns two text parts", inputSchema: objectSchema },
    { name: "throws", inputSchema: objectSchema },
  ],
];

const UPSTREAM_RESULTS: Record<string, (args: Record<string, unknown>) => CallToolResult> = {
  echo: (args) => ({ content: [{ type: "text", text: JSON.stringify(args) }] }),
  structured: () => ({ content: [{ type: "text", text: "ignored" }], structuredContent: { value: 1 } }),
  failing: () => ({ content: [{ type: "text", text: "upstream exploded" }], isError: true }),
  failing_silent: () => ({ content: [], isError: true }),
  image: () => ({ content: [{ type: "image", data: "aGk=", mimeType: "image/png" }] }),
  plain: () => ({ content: [{ type: "text", text: "not json" }] }),
  multi: () => ({
    content: [
      { type: "text", text: "a" },
      { type: "text", text: "b" },
    ],
  }),
};

const createUpstreamServer = () => {
  const server = new Server({ name: "upstream", version: "1.0.0" }, { capabilities: { tools: {} } });
  server.setRequestHandler(ListToolsRequestSchema, async (request) => {
    const page = Number(request.params?.cursor ?? 0);
    return { tools: UPSTREAM_PAGES[page] ?? [], ...(page + 1 < UPSTREAM_PAGES.length ? { nextCursor: String(page + 1) } : {}) };
  });
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const handler = UPSTREAM_RESULTS[request.params.name];
    if (!handler) throw new Error(`no handler for ${request.params.name}`);
    return handler(request.params.arguments ?? {});
  });
  return server;
};

const json = (value: unknown, status = 200) => Response.json(value, { status });

const authorizationServer = (origin: string) => ({
  issuer: origin,
  authorization_endpoint: `${origin}/authorize`,
  token_endpoint: `${origin}/token`,
  registration_endpoint: `${origin}/register`,
  response_types_supported: ["code"],
  code_challenge_methods_supported: ["S256"],
});

export const startMcpUpstream = () => {
  const seenHeaders: Record<string, string | null>[] = [];
  const server = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    fetch: async (request) => {
      const url = new URL(request.url);
      if (url.pathname === "/mcp") {
        seenHeaders.push({ "x-upstream": request.headers.get("x-upstream") });
        const transport = new WebStandardStreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
          enableJsonResponse: true,
        });
        await createUpstreamServer().connect(transport);
        return transport.handleRequest(request);
      }
      if (url.pathname === "/locked") return new Response("unauthorized", { status: 401 });
      if (url.pathname === "/sse-locked") {
        return request.method === "GET"
          ? new Response("unauthorized", { status: 401 })
          : new Response("method not allowed", { status: 405 });
      }
      if (url.pathname === "/.well-known/oauth-authorization-server") return json(authorizationServer(url.origin));
      if (url.pathname === "/register" && request.method === "POST") {
        const metadata = (await request.json()) as Record<string, unknown>;
        return json({ ...metadata, client_id: "upstream-client" }, 201);
      }
      return new Response("not found", { status: 404 });
    },
  });
  return { server, seenHeaders, url: (path: string) => `http://127.0.0.1:${server.port}${path}` };
};

export const OPENAPI_BULK_COUNT = 12;

export const openApiSpec = (baseUrl?: string) => ({
  openapi: "3.0.0",
  ...(baseUrl ? { servers: [{ url: baseUrl }] } : {}),
  components: {
    parameters: { ItemId: { name: "id", in: "path", required: true, schema: { type: "string" } } },
    schemas: { Item: { type: "object", properties: { title: { type: "string" } } } },
  },
  paths: {
    "/items/{id}": {
      parameters: [{ $ref: "#/components/parameters/ItemId" }],
      get: {
        operationId: "getItem",
        summary: "Get one item",
        description: "Reads an item by id",
        parameters: [
          { name: "expand", in: "query", schema: { type: "object" } },
          { name: "x-trace", in: "header", type: "string" },
          { name: "verbose", in: "query" },
          { name: "session", in: "cookie" },
        ],
      },
    },
    "/items": {
      post: {
        operationId: "create-item",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Item" } } } },
      },
      put: { requestBody: { content: { "application/json": { schema: { type: "object" } } } } },
    },
    "/text": { get: { operationId: "getText" } },
    "/fail-json": { get: { operationId: "failJson" } },
    "/fail-text": { get: { operationId: "failText" } },
    ...Object.fromEntries(
      Array.from({ length: OPENAPI_BULK_COUNT }, (_, index) => [
        `/bulk/${index}`,
        { get: { operationId: `bulk${index}`, summary: `Bulk widget ${index} ${"long description ".repeat(20)}` } },
      ]),
    ),
  },
});

export const startOpenApiUpstream = () => {
  const requests: { method: string; url: string; headers: Headers; body: string }[] = [];
  const server = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    fetch: async (request): Promise<Response> => {
      const url = new URL(request.url);
      requests.push({ method: request.method, url: request.url, headers: request.headers, body: await request.text() });
      if (url.pathname === "/spec.json") return json(openApiSpec("/api"));
      if (url.pathname === "/spec.yaml") {
        return new Response(
          `swagger: "2.0"\nhost: 127.0.0.1:${server.port}\nschemes: [http]\nbasePath: /v2/\npaths:\n  /ping:\n    get:\n      operationId: ping\n`,
        );
      }
      if (url.pathname === "/api/text" || url.pathname === "/text") return new Response("plain body");
      if (url.pathname.endsWith("/fail-json")) return json({ reason: "broken" }, 500);
      if (url.pathname.endsWith("/fail-text")) return new Response("missing", { status: 404 });
      return json({ method: request.method, path: url.pathname, query: url.search });
    },
  });
  return { server, requests, url: (path: string) => `http://127.0.0.1:${server.port}${path}` };
};

export const connectGateway = async (apiKey: string) => {
  const client = new Client({ name: "gateway-test", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL("http://localhost:4312/v1/mcp"), {
    requestInit: { headers: { authorization: `Bearer ${apiKey}`, origin: "http://localhost:4312" } },
    fetch: async (input, init) => app.request(input instanceof Request ? input : String(input), init),
  });
  await client.connect(transport);
  return client;
};

export const textOf = (result: unknown) => {
  const { content } = result as CallToolResult;
  const first = content[0];
  return first?.type === "text" ? first.text : "";
};
