import { afterAll, beforeAll, expect, test } from "bun:test";
import type { OAuthStartView } from "@runelay/shared";
import { createOAuthProvider } from "@/modules/oauth/providers/oauth-client.provider";
import { encodeBrokerState } from "@/modules/oauth/utils/oauth-broker";
import { findSource, findSourceView, updateOAuth } from "@/modules/sources/repositories/source.repository";
import { body, call, signUp, type TestAccount } from "../../../../../test/helpers";
import { type FakeMcpServer, GOOD_CODE, startFakeMcp, withEnv } from "../../../../../test/sources-helpers";

const BROKER_URL = "https://auth.runelay.test";
const RELAY_CALLBACK = `${BROKER_URL}/mcp/callback`;

let account: TestAccount;
let relayServer: FakeMcpServer;
let refusingServer: FakeMcpServer;
const restores: (() => void)[] = [];

const addSource = (name: string, url: string) =>
  call("/v1/sources", { method: "POST", cookie: account.cookie, json: { name, config: { kind: "mcp", url } } });

const start = async (name: string) => {
  const response = await call(`/v1/sources/${name}/oauth`, { method: "POST", cookie: account.cookie });
  return body<OAuthStartView>(response);
};

beforeAll(async () => {
  restores.push(withEnv("RUNELAY_ALLOW_PRIVATE_URLS", true));
  restores.push(withEnv("RUNELAY_OAUTH_BROKER_URL", BROKER_URL));
  account = await signUp("Relay Owner");
  relayServer = startFakeMcp({ requireToken: true, allowedRedirectUris: [RELAY_CALLBACK] });
  refusingServer = startFakeMcp({ requireToken: true, allowedRedirectUris: [] });
  await addSource("vercel", relayServer.mcpUrl);
  await addSource("locked", refusingServer.mcpUrl);
});

afterAll(() => {
  for (const restore of restores.reverse()) restore();
  relayServer.stop();
  refusingServer.stop();
});

const registrations = (server: FakeMcpServer) =>
  server.requests.filter((request) => request === "POST /register").length;

const key = (name: string) => ({ organizationId: account.organizationId, name });

test("a refused instance redirect is retried once through the broker relay", async () => {
  const before = registrations(relayServer);
  const { data } = await start("vercel");
  expect(registrations(relayServer) - before).toBe(2);
  const url = new URL(data.authorizationUrl ?? "");
  expect(url.searchParams.get("client_id")).toBe("fake-client");
  expect(url.searchParams.get("redirect_uri")).toBe(RELAY_CALLBACK);
  expect(url.searchParams.get("code_challenge")).toBeTruthy();
  const state = JSON.parse(Buffer.from(url.searchParams.get("state") ?? "", "base64url").toString());
  expect(state).toEqual({ r: "http://localhost:4312/v1/oauth/callback", s: "vercel" });
  const client = findSource(key("vercel")).data?.oauth.client;
  expect(client && "redirect_uris" in client ? client.redirect_uris : []).toEqual([RELAY_CALLBACK]);
});

test("the relayed code is exchanged directly with the server using the relay redirect", async () => {
  const response = await call(`/v1/oauth/callback?state=${encodeBrokerState("vercel")}&code=${GOOD_CODE}`, {
    cookie: account.cookie,
  });
  expect(response.headers.get("location")).toBe("/connectors/vercel?oauth=done");
  const exchange = relayServer.tokenRequests.at(-1)?.form;
  expect(exchange).toMatchObject({
    grant_type: "authorization_code",
    code: GOOD_CODE,
    client_id: "fake-client",
    redirect_uri: RELAY_CALLBACK,
  });
  expect(exchange?.code_verifier).toBeTruthy();
  expect(findSourceView(key("vercel")).data?.status).toBe("ok");
});

test("a saved relay client keeps the relay redirect on the next login", async () => {
  const provider = createOAuthProvider(key("vercel"));
  expect(provider.redirectUrl).toBe(RELAY_CALLBACK);
  expect(await provider.state?.()).toBe(encodeBrokerState("vercel"));
  const before = registrations(relayServer);
  const { data } = await start("vercel");
  expect(new URL(data.authorizationUrl ?? "").searchParams.get("redirect_uri")).toBe(RELAY_CALLBACK);
  expect(registrations(relayServer)).toBe(before);
});

test("a server that refuses both redirects gets an actionable error", async () => {
  const before = registrations(refusingServer);
  const response = await call("/v1/sources/locked/oauth", { method: "POST", cookie: account.cookie });
  const payload = (await response.json()) as { error: { message: string } };
  expect(payload.error.message).toContain("só aceita endereços de retorno aprovados");
  expect(payload.error.message).toContain("Usar meu próprio cliente OAuth");
  expect(payload.error.message).toContain(RELAY_CALLBACK);
  expect(registrations(refusingServer) - before).toBe(2);
  expect(findSource(key("locked")).data?.oauth.client).toBeUndefined();
});

test("only sources without their own client follow the relay", () => {
  const direct = "http://localhost:4312/v1/oauth/callback";
  expect(createOAuthProvider(key("locked")).redirectUrl).toBe(direct);
  expect(createOAuthProvider(key("locked"), undefined, { relay: true }).redirectUrl).toBe(RELAY_CALLBACK);
  updateOAuth(key("locked"), { customClient: { clientId: "mine" } });
  expect(createOAuthProvider(key("locked"), undefined, { relay: true }).redirectUrl).toBe(direct);
});
