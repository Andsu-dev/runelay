import { afterEach, expect, test } from "bun:test";
import { detectSourceAuth } from "../auth-detection.service";

const realFetch = globalThis.fetch;
const MCP = "http://93.184.215.14/mcp";

afterEach(() => {
  globalThis.fetch = realFetch;
});

const stubFetch = (routes: Record<string, () => Response>) => {
  globalThis.fetch = Object.assign(
    async (input: string | URL | Request) => routes[String(input)]?.() ?? new Response(null, { status: 404 }),
    { preconnect: realFetch.preconnect },
  );
};

const detect = async (url = MCP) => (await detectSourceAuth(url)).data?.auth;

test("answers unknown for a status that is not about auth", async () => {
  stubFetch({ [MCP]: () => new Response(null, { status: 500 }) });
  expect(await detect()).toBe("unknown");
});

test("finds oauth in the path-scoped protected resource metadata", async () => {
  stubFetch({
    [MCP]: () => new Response(null, { status: 401 }),
    "http://93.184.215.14/.well-known/oauth-protected-resource/mcp": () =>
      Response.json({ authorization_servers: ["https://auth.example.com"] }),
  });
  expect(await detect()).toBe("oauth");
});

test("answers header when a 401 brings no oauth metadata", async () => {
  stubFetch({
    [MCP]: () => new Response(null, { status: 403, headers: { "www-authenticate": "Basic realm=x" } }),
    "http://93.184.215.14/.well-known/oauth-protected-resource": () => new Response("not json"),
    "http://93.184.215.14/.well-known/oauth-protected-resource/mcp": () => {
      throw new Error("offline");
    },
  });
  expect(await detect()).toBe("header");
});

test("checks only the root metadata when the url has no path", async () => {
  stubFetch({
    "http://93.184.215.14/": () => new Response(null, { status: 401 }),
    "http://93.184.215.14/.well-known/oauth-protected-resource": () => Response.json({ authorization_servers: [] }),
  });
  expect(await detect("http://93.184.215.14/")).toBe("header");
});
