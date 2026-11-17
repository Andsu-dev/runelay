import { afterAll, beforeAll, expect, test } from "bun:test";
import type { OAuthStartView } from "@runelay/shared";
import { createOAuthProvider } from "@/modules/oauth/providers/oauth-client.provider";
import { encodeBrokerState } from "@/modules/oauth/utils/oauth-broker";
import { findSource, findSourceView } from "@/modules/sources/repositories/source.repository";
import { body, call, signUp, type TestAccount } from "../../../../../test/helpers";
import { type FakeMcpServer, GOOD_CODE, startFakeMcp, withEnv } from "../../../../../test/sources-helpers";

const BROKER_URL = "https://auth.runelay.test";
const RELAY_CALLBACK = `${BROKER_URL}/mcp/callback`;
const CLIENT_METADATA_URL = `${BROKER_URL}/mcp/client.json`;
const DIRECT_CALLBACK = "http://localhost:4312/v1/oauth/callback";
const CIMD = { client_id_metadata_document_supported: true };

let account: TestAccount;
let lockedCimd: FakeMcpServer;
let openCimd: FakeMcpServer;
const restores: (() => void)[] = [];

const addSource = (name: string, url: string) =>
  call("/v1/sources", { method: "POST", cookie: account.cookie, json: { name, config: { kind: "mcp", url } } });

const start = async (name: string) => {
  const response = await call(`/v1/sources/${name}/oauth`, { method: "POST", cookie: account.cookie });
  return body<OAuthStartView>(response);
};

const registrations = (server: FakeMcpServer) =>
  server.requests.filter((request) => request === "POST /register").length;

const key = (name: string) => ({ organizationId: account.organizationId, name });

beforeAll(async () => {
  restores.push(withEnv("RUNELAY_ALLOW_PRIVATE_URLS", true));
  restores.push(withEnv("RUNELAY_OAUTH_BROKER_URL", BROKER_URL));
  account = await signUp("Cimd Owner");
  lockedCimd = startFakeMcp({ requireToken: true, allowedRedirectUris: [], authorizationServer: CIMD });
  openCimd = startFakeMcp({ requireToken: true, authorizationServer: CIMD });
  await addSource("vercel", lockedCimd.mcpUrl);
  await addSource("linear", openCimd.mcpUrl);
});

afterAll(() => {
  for (const restore of restores.reverse()) restore();
  lockedCimd.stop();
  openCimd.stop();
});

test("a refused redirect falls back to the client metadata document without registering again", async () => {
  const before = registrations(lockedCimd);
  const { data } = await start("vercel");
  expect(registrations(lockedCimd) - before).toBe(1);
  const url = new URL(data.authorizationUrl ?? "");
  expect(url.origin + url.pathname).toBe(`${lockedCimd.base}/authorize`);
  expect(url.searchParams.get("client_id")).toBe(CLIENT_METADATA_URL);
  expect(url.searchParams.get("redirect_uri")).toBe(RELAY_CALLBACK);
  expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  expect(url.searchParams.get("code_challenge")).toBeTruthy();
  expect(url.searchParams.get("state")).toBe(encodeBrokerState("vercel"));
  expect(findSource(key("vercel")).data?.oauth.client).toEqual({
    client_id: CLIENT_METADATA_URL,
    issuer: lockedCimd.base,
  });
});

test("the code is exchanged with the server as a public client using the relay redirect", async () => {
  const response = await call(`/v1/oauth/callback?state=${encodeBrokerState("vercel")}&code=${GOOD_CODE}`, {
    cookie: account.cookie,
  });
  expect(response.headers.get("location")).toBe("/connectors/vercel?oauth=done");
  const exchange = lockedCimd.tokenRequests.at(-1);
  expect(exchange?.authorization).toBeNull();
  expect(exchange?.form).toMatchObject({
    grant_type: "authorization_code",
    code: GOOD_CODE,
    client_id: CLIENT_METADATA_URL,
    redirect_uri: RELAY_CALLBACK,
  });
  expect(exchange?.form.client_secret).toBeUndefined();
  expect(exchange?.form.code_verifier).toBeTruthy();
  expect(findSourceView(key("vercel")).data?.status).toBe("ok");
});

test("a saved metadata document client keeps the relay on the next login", async () => {
  const provider = createOAuthProvider(key("vercel"));
  expect(provider.redirectUrl).toBe(RELAY_CALLBACK);
  expect(provider.clientMetadataUrl).toBe(CLIENT_METADATA_URL);
  const before = registrations(lockedCimd);
  const { data } = await start("vercel");
  const url = new URL(data.authorizationUrl ?? "");
  expect(url.searchParams.get("client_id")).toBe(CLIENT_METADATA_URL);
  expect(url.searchParams.get("redirect_uri")).toBe(RELAY_CALLBACK);
  expect(registrations(lockedCimd)).toBe(before);
});

test("servers that accept the instance redirect keep dynamic registration even when they advertise CIMD", async () => {
  const { data } = await start("linear");
  expect(registrations(openCimd)).toBe(1);
  const url = new URL(data.authorizationUrl ?? "");
  expect(url.searchParams.get("client_id")).toBe("fake-client");
  expect(url.searchParams.get("redirect_uri")).toBe(DIRECT_CALLBACK);
  expect(url.searchParams.get("state")).toBe("linear");
  expect(createOAuthProvider(key("linear")).clientMetadataUrl).toBeUndefined();
});

test("a non-https broker never offers a metadata document", () => {
  const restore = withEnv("RUNELAY_OAUTH_BROKER_URL", "http://127.0.0.1:9");
  try {
    const provider = createOAuthProvider(key("linear"), undefined, { relay: true });
    expect(provider.redirectUrl).toBe("http://127.0.0.1:9/mcp/callback");
    expect(provider.clientMetadataUrl).toBeUndefined();
  } finally {
    restore();
  }
});
