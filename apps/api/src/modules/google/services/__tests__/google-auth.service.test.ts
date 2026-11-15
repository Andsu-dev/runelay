import { afterAll, beforeAll, beforeEach, expect, test } from "bun:test";
import type { GoogleConfig } from "@runelay/shared";
import { GOOGLE_BASE_SCOPES, GOOGLE_SERVICE_SCOPES } from "@/modules/google/constants/google.constants";
import {
  buildGoogleAuthorizationUrl,
  completeGoogleLogin,
  getGoogleAccessToken,
  googleClientId,
  startGoogleLogin,
} from "@/modules/google/services/google-auth.service";
import { googleTransport } from "@/modules/google/utils/google-fetch";
import { scopesFor } from "@/modules/google/utils/google-scopes";
import { GOOGLE_BROKER_CLIENT_ID } from "@/modules/oauth/constants/oauth.constants";
import {
  findSource,
  findSourceView,
  updateOAuth,
  upsertSource,
} from "@/modules/sources/repositories/source.repository";
import {
  type FakeGoogle,
  GOOGLE_ACCESS,
  GOOGLE_CODE,
  GOOGLE_REFRESH,
  startFakeGoogle,
} from "../../../../../test/google-helpers";
import { signUp, type TestAccount } from "../../../../../test/helpers";
import { withEnv } from "../../../../../test/sources-helpers";

const CONFIG: GoogleConfig = { kind: "google", services: ["gmail", "meet"] };

let account: TestAccount;
let google: FakeGoogle;
let restore: () => void;

const key = () => ({ organizationId: account.organizationId, name: "google" });
const oauth = () => findSource(key()).data?.oauth ?? {};

beforeAll(async () => {
  google = startFakeGoogle();
  restore = google.install();
  account = await signUp("Google Auth");
});

beforeEach(() => {
  upsertSource(account.organizationId, { name: "google", config: CONFIG });
  updateOAuth(key(), { tokens: undefined, google: undefined, verifier: undefined });
  google.tokenReply = null;
  google.grantedScope = scopesFor(CONFIG.services).join(" ");
  google.routes.clear();
});

afterAll(() => {
  restore();
  google.stop();
});

const paramsOf = (url: string | null | undefined) => new URL(url ?? "").searchParams;

test("first connect asks for every selected scope with consent and offline access", () => {
  const started = startGoogleLogin(key(), CONFIG);
  const url = new URL(started.data?.authorizationUrl ?? "");
  const params = url.searchParams;
  expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
  expect(params.get("client_id")).toBe(GOOGLE_BROKER_CLIENT_ID);
  expect(params.get("redirect_uri")).toBe(`${google.base}/broker/google/callback`);
  expect(params.get("response_type")).toBe("code");
  expect(params.get("scope")?.split(" ")).toEqual(scopesFor(CONFIG.services));
  expect(params.get("access_type")).toBe("offline");
  expect(params.get("prompt")).toBe("consent");
  expect(params.has("include_granted_scopes")).toBe(false);
  expect(params.get("code_challenge_method")).toBe("S256");
  const challenge = new Bun.CryptoHasher("sha256").update(oauth().verifier ?? "").digest("base64url");
  expect(params.get("code_challenge")).toBe(challenge);
  const state = JSON.parse(Buffer.from(params.get("state") ?? "", "base64url").toString());
  expect(state).toEqual({ r: "http://localhost:4312/v1/oauth/callback", s: "google" });
});

test("a later connect only asks for the new scopes and skips the consent prompt", () => {
  const granted = scopesFor(["gmail"]);
  const built = buildGoogleAuthorizationUrl(key(), CONFIG, {
    tokens: { access_token: "a", token_type: "Bearer", refresh_token: "r" },
    google: { scopes: granted },
  });
  const params = paramsOf(built.url);
  expect(params.get("scope")).toBe(GOOGLE_SERVICE_SCOPES.meet.join(" "));
  expect(params.has("prompt")).toBe(false);
  expect(params.get("include_granted_scopes")).toBe("true");
  expect(params.get("access_type")).toBe("offline");
});

test("start returns no url when every scope is already granted", () => {
  updateOAuth(key(), {
    tokens: { access_token: "a", token_type: "Bearer", refresh_token: "r" },
    google: { scopes: scopesFor(CONFIG.services) },
  });
  expect(startGoogleLogin(key(), CONFIG).data).toEqual({ authorizationUrl: null });
  expect(startGoogleLogin({ organizationId: account.organizationId, name: "nope" }, CONFIG).error?.code).toBe(
    "SOURCE_NOT_FOUND",
  );
});

test("the client id can be overridden by env", () => {
  const restoreEnv = withEnv("RUNELAY_GOOGLE_CLIENT_ID", "custom.apps.googleusercontent.com");
  try {
    expect(googleClientId()).toBe("custom.apps.googleusercontent.com");
  } finally {
    restoreEnv();
  }
});

test("the callback exchanges the code at the broker and stores tokens, scopes and profile", async () => {
  startGoogleLogin(key(), CONFIG);
  const verifier = oauth().verifier;
  google.routes.set("GET openidconnect.googleapis.com/v1/userinfo", () => ({
    body: { email: "ana@example.com", name: "Ana" },
  }));
  const before = Date.now();
  expect((await completeGoogleLogin(key(), GOOGLE_CODE)).error).toBeNull();
  expect(google.tokenForms.at(-1)).toEqual({
    client_id: GOOGLE_BROKER_CLIENT_ID,
    grant_type: "authorization_code",
    code: GOOGLE_CODE,
    code_verifier: verifier ?? "",
    redirect_uri: `${google.base}/broker/google/callback`,
  });
  expect(google.last("openidconnect.googleapis.com").authorization).toBe(`Bearer ${GOOGLE_ACCESS}`);
  const stored = oauth();
  expect(stored.tokens).toMatchObject({ access_token: GOOGLE_ACCESS, refresh_token: GOOGLE_REFRESH });
  expect(stored.verifier).toBeUndefined();
  expect(stored.google).toMatchObject({ email: "ana@example.com", name: "Ana" });
  expect(stored.google?.scopes.sort()).toEqual(scopesFor(CONFIG.services).sort());
  expect(stored.google?.expiresAt).toBeGreaterThanOrEqual(before + 3_600_000);
  expect(findSourceView(key()).data?.connectedAt).toBeTruthy();
});

test("an incremental callback keeps the refresh token and unions the scopes", async () => {
  updateOAuth(key(), {
    tokens: { access_token: "old", token_type: "Bearer", refresh_token: "kept-refresh" },
    google: { scopes: [...GOOGLE_BASE_SCOPES], email: "ana@example.com" },
  });
  google.tokenReply = () => ({
    body: { access_token: "new-access", expires_in: 3600, scope: GOOGLE_SERVICE_SCOPES.gmail.join(" ") },
  });
  google.routes.set("GET openidconnect.googleapis.com/v1/userinfo", () => ({ status: 500, body: {} }));
  expect((await completeGoogleLogin(key(), "any")).error).toBeNull();
  const stored = oauth();
  expect(stored.tokens).toMatchObject({
    access_token: "new-access",
    refresh_token: "kept-refresh",
    token_type: "Bearer",
  });
  expect(stored.google?.scopes).toEqual([...GOOGLE_BASE_SCOPES, ...GOOGLE_SERVICE_SCOPES.gmail]);
  expect(stored.google?.email).toBe("ana@example.com");
});

test("a broken or unreachable userinfo still completes the login without a profile", async () => {
  google.routes.set("GET openidconnect.googleapis.com/v1/userinfo", () => ({ text: "not json" }));
  expect((await completeGoogleLogin(key(), GOOGLE_CODE)).error).toBeNull();
  expect(oauth().google?.email).toBeUndefined();
  const installed = googleTransport.fetch;
  googleTransport.fetch = () => Promise.reject(new Error("offline"));
  try {
    expect((await completeGoogleLogin(key(), GOOGLE_CODE)).error).toBeNull();
  } finally {
    googleTransport.fetch = installed;
  }
  expect(oauth().tokens?.access_token).toBe(GOOGLE_ACCESS);
  expect(oauth().google?.name).toBeUndefined();
});

test("a rejected code reports Google's message", async () => {
  const result = await completeGoogleLogin(key(), "wrong");
  expect(result.error).toMatchObject({ code: "OAUTH_FAILED", message: "O Google recusou o login: Bad Request" });
  google.tokenReply = () => ({ status: 502, text: "bad gateway" });
  expect((await completeGoogleLogin(key(), "wrong")).error?.message).toBe("O Google recusou o login: HTTP 502");
  google.tokenReply = () => ({ status: 400, body: { error: "invalid_request" } });
  expect((await completeGoogleLogin(key(), "wrong")).error?.message).toBe("O Google recusou o login: invalid_request");
  expect((await completeGoogleLogin({ organizationId: account.organizationId, name: "nope" }, "x")).error?.code).toBe(
    "SOURCE_NOT_FOUND",
  );
});

test("an unreachable broker fails the exchange", async () => {
  const restoreBroker = withEnv("RUNELAY_OAUTH_BROKER_URL", "http://127.0.0.1:1");
  try {
    expect((await completeGoogleLogin(key(), GOOGLE_CODE)).error?.code).toBe("OAUTH_FAILED");
  } finally {
    restoreBroker();
  }
});

test("a valid access token is returned without refreshing", async () => {
  updateOAuth(key(), {
    tokens: { access_token: "fresh", token_type: "Bearer", refresh_token: GOOGLE_REFRESH },
    google: { scopes: [], expiresAt: Date.now() + 600_000 },
  });
  const forms = google.tokenForms.length;
  expect((await getGoogleAccessToken(key())).data).toBe("fresh");
  updateOAuth(key(), { google: { scopes: [] } });
  expect((await getGoogleAccessToken(key())).data).toBe("fresh");
  expect(google.tokenForms).toHaveLength(forms);
});

test("an expiring access token is refreshed once through the broker", async () => {
  updateOAuth(key(), {
    tokens: { access_token: "stale", token_type: "Bearer", refresh_token: GOOGLE_REFRESH },
    google: { scopes: ["openid"], expiresAt: Date.now() + 30_000 },
  });
  google.grantedScope = "";
  const [first, second] = await Promise.all([getGoogleAccessToken(key()), getGoogleAccessToken(key())]);
  expect(first.data).toBe(GOOGLE_ACCESS);
  expect(second.data).toBe(GOOGLE_ACCESS);
  expect(google.tokenForms.filter((form) => form.grant_type === "refresh_token")).toHaveLength(1);
  expect(google.tokenForms.at(-1)).toEqual({
    client_id: GOOGLE_BROKER_CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: GOOGLE_REFRESH,
  });
  expect(oauth().tokens?.refresh_token).toBe(GOOGLE_REFRESH);
  expect(oauth().google?.scopes).toEqual(["openid"]);
  google.tokenForms.length = 0;
});

test("a refresh without expiry keeps the token forever", async () => {
  updateOAuth(key(), {
    tokens: { access_token: "stale", token_type: "Bearer", refresh_token: GOOGLE_REFRESH },
    google: { scopes: [], expiresAt: 1 },
  });
  google.tokenReply = () => ({ body: { access_token: "no-expiry" } });
  expect((await getGoogleAccessToken(key())).data).toBe("no-expiry");
  expect(oauth().google?.expiresAt).toBeUndefined();
});

test("a revoked refresh token marks the source as needing auth", async () => {
  updateOAuth(key(), {
    tokens: { access_token: "stale", token_type: "Bearer", refresh_token: "revoked" },
    google: { scopes: scopesFor(CONFIG.services), expiresAt: 1, email: "ana@example.com" },
  });
  const result = await getGoogleAccessToken(key());
  expect(result.error?.code).toBe("NEEDS_AUTH");
  expect(oauth().tokens).toBeUndefined();
  expect(oauth().google).toMatchObject({ scopes: [], email: "ana@example.com" });
  expect(findSourceView(key()).data?.status).toBe("needs_auth");
});

test("other refresh failures do not drop the tokens", async () => {
  updateOAuth(key(), {
    tokens: { access_token: "stale", token_type: "Bearer", refresh_token: GOOGLE_REFRESH },
    google: { scopes: [], expiresAt: 1 },
  });
  google.tokenReply = () => ({ status: 500, body: { error: "server_error" } });
  expect((await getGoogleAccessToken(key())).error?.code).toBe("OAUTH_FAILED");
  expect(oauth().tokens?.refresh_token).toBe(GOOGLE_REFRESH);
});

test("missing tokens or refresh token need a new login", async () => {
  expect((await getGoogleAccessToken(key())).error?.code).toBe("NEEDS_AUTH");
  updateOAuth(key(), { tokens: { access_token: "stale", token_type: "Bearer" }, google: { scopes: [], expiresAt: 1 } });
  expect((await getGoogleAccessToken(key())).error?.message).toBe("O acesso ao Google expirou. Conecte de novo.");
  expect((await getGoogleAccessToken({ organizationId: account.organizationId, name: "nope" })).error?.code).toBe(
    "SOURCE_NOT_FOUND",
  );
});
