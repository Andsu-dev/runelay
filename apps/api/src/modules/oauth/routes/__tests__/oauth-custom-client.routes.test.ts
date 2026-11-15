import { afterAll, beforeAll, expect, test } from "bun:test";
import type { OAuthStartView, SourceView } from "@runelay/shared";
import { createOAuthFetch, createOAuthProvider } from "@/modules/oauth/providers/oauth-client.provider";
import { findSource, findSourceView } from "@/modules/sources/repositories/source.repository";
import { body, call, signUp, type TestAccount } from "../../../../../test/helpers";
import { type FakeMcpServer, GOOD_CODE, startFakeMcp, withEnv } from "../../../../../test/sources-helpers";

const CLIENT = { clientId: "own-client.apps.test", clientSecret: "own-secret" };

let account: TestAccount;
let server: FakeMcpServer;
const restores: (() => void)[] = [];

beforeAll(async () => {
  restores.push(withEnv("RUNELAY_ALLOW_PRIVATE_URLS", true));
  account = await signUp("Custom Client Owner");
  server = startFakeMcp({
    requireToken: true,
    rejectRegistration: true,
    authorizationServer: {
      registration_endpoint: undefined,
      token_endpoint_auth_methods_supported: ["client_secret_post"],
    },
  });
});

afterAll(() => {
  for (const restore of restores.reverse()) restore();
  server.stop();
});

const key = () => ({ organizationId: account.organizationId, name: "drive" });

const patch = (payload: unknown) =>
  call("/v1/sources/drive", { method: "PATCH", cookie: account.cookie, json: payload });

const startLogin = async () => {
  const response = await call("/v1/sources/drive/oauth", { method: "POST", cookie: account.cookie });
  return body<OAuthStartView>(response);
};

test("a source created with its own OAuth client keeps it and shows only the client id", async () => {
  const response = await call("/v1/sources", {
    method: "POST",
    cookie: account.cookie,
    json: { name: "drive", config: { kind: "mcp", url: server.mcpUrl }, oauthClient: CLIENT },
  });
  expect(response.status).toBe(201);
  const { data } = await body<SourceView>(response);
  expect(data.status).toBe("needs_auth");
  expect(data.oauthClientId).toBe(CLIENT.clientId);
  expect(JSON.stringify(data)).not.toContain(CLIENT.clientSecret);
  expect(findSource(key()).data?.oauth.customClient).toEqual(CLIENT);
});

test("login uses the custom client instead of registering one", async () => {
  const { data } = await startLogin();
  const url = new URL(data.authorizationUrl ?? "");
  expect(url.origin + url.pathname).toBe(`${server.base}/authorize`);
  expect(url.searchParams.get("client_id")).toBe(CLIENT.clientId);
  expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:4312/v1/oauth/callback");
  expect(url.searchParams.get("state")).toBe("drive");
  expect(server.requests).not.toContain("POST /register");
});

test("the code is exchanged with the custom client secret", async () => {
  const response = await call(`/v1/oauth/callback?state=drive&code=${GOOD_CODE}`, { cookie: account.cookie });
  expect(response.headers.get("location")).toBe("/connectors/drive?oauth=done");
  expect(server.tokenRequests.at(-1)?.form).toMatchObject({
    grant_type: "authorization_code",
    code: GOOD_CODE,
    client_id: CLIENT.clientId,
    client_secret: CLIENT.clientSecret,
  });
  expect(findSourceView(key()).data?.status).toBe("ok");
});

test("the custom client survives invalidation and client saves", async () => {
  const provider = createOAuthProvider(key());
  await provider.saveClientInformation?.({ client_id: "registered" });
  await provider.invalidateCredentials?.("all");
  expect(await provider.clientInformation()).toEqual({
    client_id: CLIENT.clientId,
    client_secret: CLIENT.clientSecret,
  });
  expect(findSource(key()).data?.oauth.client).toBeUndefined();
});

test("changing the client drops the old login", async () => {
  await call(`/v1/oauth/callback?state=drive&code=${GOOD_CODE}`, { cookie: account.cookie });
  const response = await patch({ oauthClient: { clientId: "other-client" } });
  const { data } = await body<SourceView>(response);
  expect(data.oauthClientId).toBe("other-client");
  expect(data.status).toBe("needs_auth");
  const oauth = findSource(key()).data?.oauth;
  expect(oauth?.tokens).toBeUndefined();
  expect(oauth?.customClient).toEqual({ clientId: "other-client" });
});

test("removing the client goes back to dynamic registration", async () => {
  const response = await patch({ oauthClient: null });
  const { data } = await body<SourceView>(response);
  expect(data.oauthClientId).toBeNull();
  expect(findSource(key()).data?.oauth.customClient).toBeUndefined();
  const login = await call("/v1/sources/drive/oauth", { method: "POST", cookie: account.cookie });
  expect(login.status).toBeGreaterThanOrEqual(400);
});

test("a server that lists tools without a token still waits for the login", async () => {
  const open = startFakeMcp();
  const response = await call("/v1/sources", {
    method: "POST",
    cookie: account.cookie,
    json: { name: "open", config: { kind: "mcp", url: open.mcpUrl }, oauthClient: CLIENT },
  });
  const { data } = await body<SourceView>(response);
  open.stop();
  expect(data.status).toBe("needs_auth");
});

test("Google logins ask for a refresh token", async () => {
  let redirected: URL | undefined;
  const provider = createOAuthProvider(key(), (url) => {
    redirected = url;
  });
  await provider.redirectToAuthorization(new URL("https://accounts.google.com/o/oauth2/v2/auth?client_id=x"));
  expect(redirected?.searchParams.get("access_type")).toBe("offline");
  expect(redirected?.searchParams.get("prompt")).toBe("consent");
  await provider.redirectToAuthorization(new URL("https://login.example.test/authorize?client_id=x"));
  expect(redirected?.searchParams.has("access_type")).toBe(false);
});

test("Google logins drop the resource parameter and other providers keep it", async () => {
  let redirected: URL | undefined;
  const provider = createOAuthProvider(key(), (url) => {
    redirected = url;
  });
  const resource = "resource=https%3A%2F%2Fmcp.test%2Fmcp";
  await provider.redirectToAuthorization(
    new URL(`https://accounts.google.com/o/oauth2/v2/auth?client_id=x&${resource}`),
  );
  expect(redirected?.searchParams.has("resource")).toBe(false);
  expect(redirected?.searchParams.get("client_id")).toBe("x");
  await provider.redirectToAuthorization(new URL(`https://login.example.test/authorize?client_id=x&${resource}`));
  expect(redirected?.searchParams.get("resource")).toBe("https://mcp.test/mcp");
});

test("Google token requests drop the resource parameter and other providers keep it", async () => {
  const sent: { url: string; body: string }[] = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    sent.push({ url: String(input), body: String(init?.body) });
    return new Response("{}");
  }) as typeof fetch;
  const form = () => new URLSearchParams({ grant_type: "refresh_token", resource: "https://mcp.test/mcp" });
  const oauthFetch = createOAuthFetch(key());
  await oauthFetch("https://oauth2.googleapis.com/token", { method: "POST", body: form() });
  await oauthFetch("https://oauth2.googleapis.com/token", { method: "POST", body: form().toString() });
  await oauthFetch("https://login.example.test/token", { method: "POST", body: form() });
  await oauthFetch("https://oauth2.googleapis.com/token", { method: "GET" });
  globalThis.fetch = realFetch;
  expect(sent.map(({ body }) => new URLSearchParams(body).has("resource"))).toEqual([false, false, true, false]);
  expect(new URLSearchParams(sent[0]?.body).get("grant_type")).toBe("refresh_token");
});
