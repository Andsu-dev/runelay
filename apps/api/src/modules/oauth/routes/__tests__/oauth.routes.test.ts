import { afterAll, beforeAll, expect, test } from "bun:test";
import type { OAuthStartView } from "@runelay/shared";
import { createOAuthProvider } from "@/modules/oauth/providers/oauth-client.provider";
import { completeLogin } from "@/modules/oauth/services/oauth.service";
import { findSource, findSourceView } from "@/modules/sources/repositories/source.repository";
import { connectGateway, textOf } from "../../../../../test/gateway-helpers";
import { body, call, createApiKey, signUp, type TestAccount } from "../../../../../test/helpers";
import { type FakeMcpServer, GOOD_CODE, INLINE_SPEC, startFakeMcp, withEnv } from "../../../../../test/sources-helpers";

let account: TestAccount;
let server: FakeMcpServer;
let restore: () => void;

beforeAll(async () => {
  restore = withEnv("RUNELAY_ALLOW_PRIVATE_URLS", true);
  account = await signUp("OAuth Owner");
  server = startFakeMcp({ requireToken: true });
  await call("/v1/sources", {
    method: "POST",
    cookie: account.cookie,
    json: { name: "guarded", config: { kind: "mcp", url: server.mcpUrl } },
  });
  await call("/v1/sources", {
    method: "POST",
    cookie: account.cookie,
    json: { name: "spec", config: { kind: "openapi", spec: INLINE_SPEC } },
  });
});

afterAll(() => {
  restore();
  server.stop();
});

const key = () => ({ organizationId: account.organizationId, name: "guarded" });

const callback = (query: string, auth: { cookie?: string; bearer?: string } = {}) =>
  call(`/v1/oauth/callback?${query}`, auth.bearer ? auth : { cookie: account.cookie });

test("callback requires a session", async () => {
  const apiKey = await createApiKey(account, "oauth");
  const response = await callback("state=guarded&code=x", { bearer: apiKey.key });
  expect(response.status).toBe(401);
});

test("callback without a code redirects with the provider error", async () => {
  const described = await callback("state=guarded&error=access_denied&error_description=Negado");
  expect(described.status).toBe(302);
  expect(described.headers.get("location")).toBe("/connectors/guarded?oauth=done&oauth_error=Negado");
  const plain = await callback("state=guarded&error=access_denied");
  expect(plain.headers.get("location")).toBe("/connectors/guarded?oauth=done&oauth_error=access_denied");
  const bare = await callback("");
  expect(bare.headers.get("location")).toBe("/connectors/?oauth=done&oauth_error=sem+code");
});

test("callback before login started reports the missing client", async () => {
  const response = await callback("state=guarded&code=early");
  expect(response.headers.get("location")).toStartWith("/connectors/guarded?oauth=done&oauth_error=");
});

test("start returns the authorization url with state and pkce", async () => {
  const response = await call("/v1/sources/guarded/oauth", { method: "POST", cookie: account.cookie });
  const { data } = await body<OAuthStartView>(response);
  const url = new URL(data.authorizationUrl ?? "");
  expect(url.origin + url.pathname).toBe(`${server.base}/authorize`);
  expect(url.searchParams.get("state")).toBe("guarded");
  expect(url.searchParams.get("client_id")).toBe("fake-client");
  expect(url.searchParams.get("code_challenge")).toBeTruthy();
});

test("callback with a rejected code redirects with the error", async () => {
  const response = await callback("state=guarded&code=wrong");
  expect(response.headers.get("location")).toStartWith("/connectors/guarded?oauth=done&oauth_error=");
  expect(findSource(key()).data?.oauth.tokens).toBeUndefined();
});

test("callback with a valid code stores tokens and connects", async () => {
  await call("/v1/sources/guarded/oauth", { method: "POST", cookie: account.cookie });
  const response = await callback(`state=guarded&code=${GOOD_CODE}`);
  expect(response.headers.get("location")).toBe("/connectors/guarded?oauth=done");
  const view = findSourceView(key());
  expect(view.data?.status).toBe("ok");
  expect(view.data?.connectedAt).toBeTruthy();
  expect(findSource(key()).data?.oauth.tokens?.access_token).toBeTruthy();
});

test("a repeated callback after a successful login keeps the connection", async () => {
  const response = await callback("state=guarded&code=wrong");
  expect(response.headers.get("location")).toBe("/connectors/guarded?oauth=done");
  expect(findSourceView(key()).data?.status).toBe("ok");
});

test("start explains when the provider refuses to register this server", async () => {
  const closed = startFakeMcp({ requireToken: true, rejectRegistration: true });
  await call("/v1/sources", {
    method: "POST",
    cookie: account.cookie,
    json: { name: "allowlisted", config: { kind: "mcp", url: closed.mcpUrl } },
  });
  const response = await call("/v1/sources/allowlisted/oauth", { method: "POST", cookie: account.cookie });
  const { error } = await body(response);
  closed.stop();
  expect(error?.message).toStartWith("allowlisted só libera login para apps aprovados");
});

test("complete login refuses non mcp sources", async () => {
  const result = await completeLogin({ organizationId: account.organizationId, name: "spec" }, GOOD_CODE);
  expect(result.error?.code).toBe("OAUTH_UNSUPPORTED");
});

test("provider clears credentials by scope and reads defaults", async () => {
  const provider = createOAuthProvider(key());
  expect(provider.state?.()).toBe("guarded");
  await provider.saveCodeVerifier("verifier");
  expect(await provider.codeVerifier()).toBe("verifier");
  for (const scope of ["verifier", "tokens", "client", "discovery", "all"] as const) {
    await provider.invalidateCredentials?.(scope);
  }
  const oauth = findSource(key()).data?.oauth;
  expect(oauth?.client).toBeUndefined();
  expect(oauth?.tokens).toBeUndefined();
  expect(await provider.codeVerifier()).toBe("");
  expect(provider.redirectToAuthorization(new URL("http://example.com"))).toBeUndefined();
  const missing = createOAuthProvider({ organizationId: account.organizationId, name: "nope" });
  expect(await missing.clientInformation()).toBeUndefined();
  expect(await missing.tokens()).toBeUndefined();
});

test("two accounts on the same remote MCP call tools with their own tokens", async () => {
  const tokensByCode = new Map([
    ["remote_pessoal", "personal-token"],
    ["remote_trabalho", "work-token"],
  ]);
  const upstream = startFakeMcp({ requireToken: true, tokensByCode });
  const { key } = await createApiKey(account, "remote-accounts");
  const gateway = await connectGateway(key);
  try {
    const first = await call("/v1/sources", {
      method: "POST",
      cookie: account.cookie,
      json: { name: "remote_pessoal", config: { kind: "mcp", url: upstream.mcpUrl } },
    });
    expect(first.status).toBe(201);
    const second = await call("/v1/sources/remote_pessoal/accounts", {
      method: "POST",
      cookie: account.cookie,
      json: { name: "Remote Trabalho" },
    });
    expect(second.status).toBe(201);
    expect((await body(second)).data).toMatchObject({ name: "remote_trabalho", status: "needs_auth" });
    const authorizations = await Promise.all(
      Array.from(tokensByCode.keys(), async (name) => {
        const response = await call(`/v1/sources/${name}/oauth`, {
          method: "POST",
          cookie: account.cookie,
        });
        return new URL((await body<OAuthStartView>(response)).data.authorizationUrl ?? "");
      }),
    );
    expect(new Set(authorizations.map((url) => url.searchParams.get("code_challenge"))).size).toBe(2);
    for (const url of authorizations) {
      const name = url.searchParams.get("state") ?? "";
      const completed = await callback(new URLSearchParams({ state: name, code: name }).toString());
      expect(completed.headers.get("location")).toBe(`/connectors/${name}?oauth=done`);
    }
    expect(new Set(upstream.tokenRequests.map(({ form }) => form.code_verifier)).size).toBe(2);
    for (const [name, token] of tokensByCode) {
      const discovered = await gateway.callTool({ name: "search_tools", arguments: { source: name } });
      expect(JSON.parse(textOf(discovered))).toContainEqual(expect.objectContaining({ name: `${name}.echo` }));
      const result = await gateway.callTool({
        name: "call_tool",
        arguments: { name: `${name}.echo`, args: { text: name } },
      });
      expect(result.isError).not.toBe(true);
      expect(textOf(result)).toBe(name);
      expect(upstream.mcpAuthorizations.at(-1)).toBe(`Bearer ${token}`);
    }
  } finally {
    await gateway.close();
    upstream.stop();
  }
});
