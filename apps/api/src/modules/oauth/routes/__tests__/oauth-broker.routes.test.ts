import { afterAll, beforeAll, expect, test } from "bun:test";
import type { OAuthStartView } from "@runelay/shared";
import { connectSource } from "@/modules/connectors/services/connection.service";
import { createOAuthProvider } from "@/modules/oauth/providers/oauth-client.provider";
import type { OAuthBroker } from "@/modules/oauth/types/oauth.types";
import { decodeOAuthState, encodeBrokerState } from "@/modules/oauth/utils/oauth-broker";
import { findSource, findSourceView, updateOAuth } from "@/modules/sources/repositories/source.repository";
import { createSource } from "@/modules/sources/services/source.service";
import { body, call, signUp, type TestAccount } from "../../../../../test/helpers";
import {
  FAKE_ACCESS_TOKEN,
  type FakeBroker,
  type FakeMcpServer,
  GOOD_CODE,
  GOOD_REFRESH_TOKEN,
  startFakeBroker,
  startFakeMcp,
  withEnv,
} from "../../../../../test/sources-helpers";

const BROKER: OAuthBroker = {
  provider: "google",
  clientId: "broker-client.apps.googleusercontent.com",
  scopes: [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  ],
};

const GITHUB_BROKER: OAuthBroker = { provider: "github", clientId: "Ov23-test", scopes: ["repo", "read:user"] };

let account: TestAccount;
let server: FakeMcpServer;
let githubServer: FakeMcpServer;
let broker: FakeBroker;
const restores: (() => void)[] = [];

beforeAll(async () => {
  restores.push(withEnv("RUNELAY_ALLOW_PRIVATE_URLS", true));
  broker = startFakeBroker();
  restores.push(withEnv("RUNELAY_OAUTH_BROKER_URL", broker.base));
  account = await signUp("Broker Owner");
  server = startFakeMcp({
    requireToken: true,
    rejectRegistration: true,
    authorizationServer: {
      token_endpoint: "https://oauth2.googleapis.com/token",
      registration_endpoint: undefined,
      token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic"],
    },
    protectedResource: { scopes_supported: ["https://scope.test/a", "https://scope.test/everything"] },
  });
  githubServer = startFakeMcp({
    requireToken: true,
    rejectRegistration: true,
    authorizationServer: {
      token_endpoint: "https://github.com/login/oauth/access_token",
      registration_endpoint: undefined,
    },
  });
  await createSource(
    account.organizationId,
    { name: "github", config: { kind: "mcp", url: githubServer.mcpUrl, headers: {} } },
    { authMethod: "session", role: "owner" },
    { broker: GITHUB_BROKER },
  );
  await createSource(
    account.organizationId,
    { name: "calendar", config: { kind: "mcp", url: server.mcpUrl, headers: {} } },
    { authMethod: "session", role: "owner" },
    { broker: BROKER },
  );
});

afterAll(() => {
  for (const restore of restores.reverse()) restore();
  server.stop();
  githubServer.stop();
  broker.stop();
});

const key = () => ({ organizationId: account.organizationId, name: "calendar" });

const callback = (query: string) => call(`/v1/oauth/callback?${query}`, { cookie: account.cookie });

const lastForm = () => broker.forms.at(-1) ?? {};

test("a broker source waits for login without registering a client", () => {
  expect(findSourceView(key()).data?.status).toBe("needs_auth");
  expect(findSource(key()).data?.oauth).toMatchObject({ broker: BROKER });
  expect(findSource(key()).data?.oauth.client).toBeUndefined();
  expect(server.requests).not.toContain("POST /register");
});

test("start sends the user to the provider through the broker callback", async () => {
  const response = await call("/v1/sources/calendar/oauth", { method: "POST", cookie: account.cookie });
  const { data } = await body<OAuthStartView>(response);
  const url = new URL(data.authorizationUrl ?? "");
  expect(url.origin + url.pathname).toBe(`${server.base}/authorize`);
  expect(url.searchParams.get("client_id")).toBe(BROKER.clientId);
  expect(url.searchParams.get("redirect_uri")).toBe(`${broker.base}/google/callback`);
  expect(url.searchParams.get("scope")).toBe("https://www.googleapis.com/auth/calendar.events");
  expect(url.searchParams.get("access_type")).toBe("offline");
  expect(url.searchParams.get("prompt")).toBe("consent");
  expect(url.searchParams.has("resource")).toBe(false);
  expect(url.searchParams.get("code_challenge")).toBeTruthy();
  const state = JSON.parse(Buffer.from(url.searchParams.get("state") ?? "", "base64url").toString());
  expect(state).toEqual({ r: "http://localhost:4312/v1/oauth/callback", s: "calendar" });
  expect(findSource(key()).data?.oauth.broker).toEqual(BROKER);
});

test("callback decodes a broker state and exchanges the code at the broker", async () => {
  const response = await callback(`state=${encodeBrokerState("calendar")}&code=${GOOD_CODE}`);
  expect(response.headers.get("location")).toBe("/connectors/calendar?oauth=done");
  expect(lastForm()).toMatchObject({
    grant_type: "authorization_code",
    code: GOOD_CODE,
    client_id: BROKER.clientId,
    redirect_uri: `${broker.base}/google/callback`,
  });
  expect(lastForm().code_verifier).toBeTruthy();
  expect(lastForm().client_secret).toBeUndefined();
  const oauth = findSource(key()).data?.oauth;
  expect(oauth?.tokens?.refresh_token).toBe(GOOD_REFRESH_TOKEN);
  expect(oauth?.client).toBeUndefined();
  expect(findSourceView(key()).data?.status).toBe("ok");
});

test("a stale access token is refreshed through the broker at runtime", async () => {
  const tokens = findSource(key()).data?.oauth.tokens;
  if (!tokens) throw new Error("missing tokens");
  updateOAuth(key(), { tokens: { ...tokens, access_token: "stale" } });
  const connected = await connectSource(key());
  expect(connected.error).toBeNull();
  expect(lastForm()).toMatchObject({
    grant_type: "refresh_token",
    refresh_token: GOOD_REFRESH_TOKEN,
    client_id: BROKER.clientId,
  });
  expect(findSource(key()).data?.oauth.tokens?.access_token).toBe(FAKE_ACCESS_TOKEN);
  expect(findSourceView(key()).data?.status).toBe("ok");
});

test("broker credentials survive invalidation and client saves", async () => {
  const provider = createOAuthProvider(key());
  await provider.saveClientInformation?.({ client_id: "registered" });
  await provider.invalidateCredentials?.("all");
  expect(await provider.clientInformation()).toEqual({ client_id: BROKER.clientId });
  const oauth = findSource(key()).data?.oauth;
  expect(oauth?.client).toBeUndefined();
  expect(oauth?.tokens).toBeUndefined();
  expect(oauth?.broker).toEqual(BROKER);
});

test("callback keeps plain and foreign states as the source name", async () => {
  expect(decodeOAuthState("calendar")).toBe("calendar");
  expect(decodeOAuthState(Buffer.from("null").toString("base64url"))).toBe("bnVsbA");
  const foreign = Buffer.from(JSON.stringify({ r: "https://x.test" })).toString("base64url");
  const response = await callback(`state=${foreign}&error=access_denied`);
  expect(response.headers.get("location")).toBe(`/connectors/${foreign}?oauth=done&oauth_error=access_denied`);
});

const githubKey = () => ({ organizationId: account.organizationId, name: "github" });

test("GitHub login goes through the broker with the GitHub client and no Google parameters", async () => {
  const response = await call("/v1/sources/github/oauth", { method: "POST", cookie: account.cookie });
  const url = new URL((await body<OAuthStartView>(response)).data.authorizationUrl ?? "");
  expect(url.origin + url.pathname).toBe(`${githubServer.base}/authorize`);
  expect(url.searchParams.get("client_id")).toBe(GITHUB_BROKER.clientId);
  expect(url.searchParams.get("redirect_uri")).toBe(`${broker.base}/github/callback`);
  expect(url.searchParams.get("scope")).toBe("repo read:user");
  expect(url.searchParams.has("access_type")).toBe(false);
  expect(url.searchParams.has("prompt")).toBe(false);
  expect(url.searchParams.has("resource")).toBe(false);
  expect(url.searchParams.get("code_challenge")).toBeTruthy();
  expect(githubServer.requests).not.toContain("POST /register");
});

test("GitHub code exchange goes to the broker GitHub token route", async () => {
  const response = await callback(`state=${encodeBrokerState("github")}&code=${GOOD_CODE}`);
  expect(response.headers.get("location")).toBe("/connectors/github?oauth=done");
  expect(broker.paths.at(-1)).toBe("/github/token");
  expect(lastForm()).toMatchObject({
    grant_type: "authorization_code",
    client_id: GITHUB_BROKER.clientId,
    redirect_uri: `${broker.base}/github/callback`,
  });
  expect(lastForm().code_verifier).toBeTruthy();
  expect(findSourceView(githubKey()).data?.status).toBe("ok");
});

test("GitHub refresh stores a rotated refresh token and keeps it when omitted", async () => {
  const stale = () => {
    const tokens = findSource(githubKey()).data?.oauth.tokens;
    if (!tokens) throw new Error("missing tokens");
    updateOAuth(githubKey(), { tokens: { ...tokens, access_token: "stale" } });
  };
  stale();
  broker.options.refreshToken = "rotated-refresh";
  expect((await connectSource(githubKey())).error).toBeNull();
  expect(broker.paths.at(-1)).toBe("/github/token");
  expect(findSource(githubKey()).data?.oauth.tokens?.refresh_token).toBe("rotated-refresh");
  stale();
  broker.options.omitRefreshToken = true;
  expect((await connectSource(githubKey())).error).toBeNull();
  expect(lastForm()).toMatchObject({ grant_type: "refresh_token", refresh_token: "rotated-refresh" });
  expect(findSource(githubKey()).data?.oauth.tokens?.refresh_token).toBe("rotated-refresh");
  broker.options.omitRefreshToken = false;
  broker.options.refreshToken = GOOD_REFRESH_TOKEN;
});

test("saving tokens without a refresh token keeps the stored one", async () => {
  updateOAuth(githubKey(), { tokens: { access_token: "a", token_type: "Bearer", refresh_token: "keep-me" } });
  await createOAuthProvider(githubKey()).saveTokens({ access_token: "b", token_type: "Bearer" });
  expect(findSource(githubKey()).data?.oauth.tokens).toMatchObject({ access_token: "b", refresh_token: "keep-me" });
});
