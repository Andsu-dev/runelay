import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { env } from "@/config/env";

export const FAKE_ACCESS_TOKEN = "fake-access-token";
export const GOOD_CODE = "good-code";

export type FakeMcpServer = {
  base: string;
  mcpUrl: string;
  requests: string[];
  stop: () => void;
};

const handleMcp = async (request: Request) => {
  const server = new McpServer({ name: "fake", version: "1.0.0" });
  server.registerTool(
    "echo",
    { description: "Echo text", inputSchema: { text: z.string() } },
    async ({ text }) => ({ content: [{ type: "text", text }] }),
  );
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  return transport.handleRequest(request);
};

export const startFakeMcp = ({
  requireToken = false,
  rejectRegistration = false,
  authorizationServer = {} as Record<string, unknown>,
  protectedResource = {} as Record<string, unknown>,
} = {}): FakeMcpServer => {
  const requests: string[] = [];
  const server: Bun.Server<undefined> = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    fetch: async (request): Promise<Response> => {
      const url = new URL(request.url);
      const base: string = `http://127.0.0.1:${server.port}`;
      requests.push(`${request.method} ${url.pathname}`);
      if (url.pathname.startsWith("/.well-known/oauth-protected-resource")) {
        return Response.json({ resource: `${base}/mcp`, authorization_servers: [base], ...protectedResource });
      }
      if (url.pathname.startsWith("/.well-known/oauth-authorization-server")) {
        return Response.json({
          issuer: base,
          authorization_endpoint: `${base}/authorize`,
          token_endpoint: `${base}/token`,
          registration_endpoint: `${base}/register`,
          response_types_supported: ["code"],
          grant_types_supported: ["authorization_code", "refresh_token"],
          code_challenge_methods_supported: ["S256"],
          token_endpoint_auth_methods_supported: ["none"],
          ...authorizationServer,
        });
      }
      if (url.pathname === "/register") {
        if (rejectRegistration) return new Response("Forbidden", { status: 403 });
        const metadata = (await request.json()) as Record<string, unknown>;
        return Response.json({ ...metadata, client_id: "fake-client" }, { status: 201 });
      }
      if (url.pathname === "/token") {
        const form = new URLSearchParams(await request.text());
        if (form.get("code") !== GOOD_CODE) return Response.json({ error: "invalid_grant" }, { status: 400 });
        return Response.json({ access_token: FAKE_ACCESS_TOKEN, token_type: "Bearer" });
      }
      if (url.pathname === "/mcp") {
        if (requireToken && request.headers.get("authorization") !== `Bearer ${FAKE_ACCESS_TOKEN}`) {
          return new Response("unauthorized", {
            status: 401,
            headers: { "www-authenticate": `Bearer resource_metadata="${base}/.well-known/oauth-protected-resource"` },
          });
        }
        return handleMcp(request);
      }
      return new Response("not found", { status: 404 });
    },
  });
  const base = `http://127.0.0.1:${server.port}`;
  return { base, mcpUrl: `${base}/mcp`, requests, stop: () => server.stop(true) };
};

export const GOOD_REFRESH_TOKEN = "good-refresh-token";

export type FakeBroker = {
  base: string;
  forms: Record<string, string>[];
  stop: () => void;
};

export const startFakeBroker = (): FakeBroker => {
  const forms: Record<string, string>[] = [];
  const server = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    fetch: async (request) => {
      if (new URL(request.url).pathname !== "/google/token") return new Response("not found", { status: 404 });
      const form = Object.fromEntries(new URLSearchParams(await request.text()));
      forms.push(form);
      const granted =
        (form.grant_type === "authorization_code" && form.code === GOOD_CODE) ||
        (form.grant_type === "refresh_token" && form.refresh_token === GOOD_REFRESH_TOKEN);
      if (!granted) return Response.json({ error: "invalid_grant" }, { status: 400 });
      return Response.json({
        access_token: FAKE_ACCESS_TOKEN,
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: GOOD_REFRESH_TOKEN,
      });
    },
  });
  return { base: `http://127.0.0.1:${server.port}`, forms, stop: () => server.stop(true) };
};

export const closedUrl = () => {
  const server = Bun.serve({ port: 0, hostname: "127.0.0.1", fetch: () => new Response("") });
  const url = `http://127.0.0.1:${server.port}/mcp`;
  server.stop(true);
  return url;
};

export const INLINE_SPEC = JSON.stringify({
  openapi: "3.0.0",
  servers: [{ url: "http://127.0.0.1:1" }],
  paths: { "/ping": { get: { operationId: "ping", summary: "Ping" } } },
});

export const withEnv = <K extends keyof typeof env>(key: K, value: (typeof env)[K]) => {
  const previous = env[key];
  env[key] = value;
  return () => {
    env[key] = previous;
  };
};
