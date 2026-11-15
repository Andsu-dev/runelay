import { createHash, randomBytes } from "node:crypto";
import { attempt, fail, type GoogleConfig, type OAuthStartView, ok, type Result } from "@runelay/shared";
import { env } from "@/config/env";
import {
  GOOGLE_API,
  GOOGLE_AUTHORIZATION_URL,
  GOOGLE_REFRESH_MARGIN_MS,
  GOOGLE_SERVICE_LABELS,
} from "@/modules/google/constants/google.constants";
import type { GoogleOAuthState, GoogleTokenResponse } from "@/modules/google/types/google.types";
import { googleFetch } from "@/modules/google/utils/google-fetch";
import { missingScopes, scopesFor, splitScopes } from "@/modules/google/utils/google-scopes";
import { GOOGLE_BROKER_CLIENT_ID } from "@/modules/oauth/constants/oauth.constants";
import { brokerCallbackUrl, brokerTokenUrl, encodeBrokerState } from "@/modules/oauth/utils/oauth-broker";
import { findSource, markConnected, updateOAuth, updateStatus } from "@/modules/sources/repositories/source.repository";
import type { OAuthState, SourceKey } from "@/modules/sources/types/source.types";
import { guardedFetch } from "@/modules/sources/utils/guarded-fetch";

const refreshing = new Map<string, Promise<Result<string>>>();

export const googleClientId = () => env.RUNELAY_GOOGLE_CLIENT_ID || GOOGLE_BROKER_CLIENT_ID;

const pkceChallenge = (verifier: string) => createHash("sha256").update(verifier).digest("base64url");

export const missingServicesMessage = (config: GoogleConfig, granted: string[]) => {
  const pending = config.services.filter((service) => missingScopes([service], granted).length > 0);
  return `Conecte o Google para liberar: ${pending.map((service) => GOOGLE_SERVICE_LABELS[service]).join(", ")}.`;
};

export const buildGoogleAuthorizationUrl = (key: SourceKey, config: GoogleConfig, oauth: OAuthState) => {
  const firstConnect = !oauth.tokens?.refresh_token;
  const scopes = firstConnect ? scopesFor(config.services) : missingScopes(config.services, oauth.google?.scopes ?? []);
  const verifier = randomBytes(32).toString("base64url");
  const url = new URL(GOOGLE_AUTHORIZATION_URL);
  url.searchParams.set("client_id", googleClientId());
  url.searchParams.set("redirect_uri", brokerCallbackUrl("google"));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scopes.join(" "));
  url.searchParams.set("state", encodeBrokerState(key.name));
  url.searchParams.set("code_challenge", pkceChallenge(verifier));
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("access_type", "offline");
  if (firstConnect) url.searchParams.set("prompt", "consent");
  else url.searchParams.set("include_granted_scopes", "true");
  return { url: url.toString(), verifier, scopes };
};

export const startGoogleLogin = (key: SourceKey, config: GoogleConfig): Result<OAuthStartView> => {
  const source = findSource(key);
  if (source.error) return source;
  const built = buildGoogleAuthorizationUrl(key, config, source.data.oauth);
  if (source.data.oauth.tokens?.refresh_token && built.scopes.length === 0) return ok({ authorizationUrl: null });
  const saved = updateOAuth(key, { verifier: built.verifier });
  return saved.error ? saved : ok({ authorizationUrl: built.url });
};

const requestToken = async (form: Record<string, string>): Promise<Result<GoogleTokenResponse>> => {
  const response = await attempt(
    () =>
      guardedFetch(brokerTokenUrl("google"), {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
        body: new URLSearchParams({ client_id: googleClientId(), ...form }).toString(),
      }),
    "OAUTH_FAILED",
  );
  if (response.error) return response;
  const payload = (await response.data.json().catch(() => ({}))) as GoogleTokenResponse;
  if (response.data.ok && payload.access_token) return ok(payload);
  const message = payload.error_description ?? payload.error ?? `HTTP ${response.data.status}`;
  return fail("OAUTH_FAILED", `O Google recusou o login: ${message}`, { error: payload.error });
};

const mergeTokens = (oauth: OAuthState, response: GoogleTokenResponse, now: number): Partial<OAuthState> => {
  const scopes = [...new Set([...(oauth.google?.scopes ?? []), ...splitScopes(response.scope)])];
  const refreshToken = response.refresh_token ?? oauth.tokens?.refresh_token;
  const google: GoogleOAuthState = {
    ...oauth.google,
    scopes,
    ...(response.expires_in ? { expiresAt: now + response.expires_in * 1000 } : { expiresAt: undefined }),
  };
  return {
    tokens: {
      access_token: response.access_token ?? "",
      token_type: response.token_type ?? "Bearer",
      scope: scopes.join(" "),
      ...(refreshToken ? { refresh_token: refreshToken } : {}),
    },
    google,
  };
};

const fetchProfile = async (accessToken: string) => {
  const response = await googleFetch(GOOGLE_API.userinfo, {
    headers: { authorization: `Bearer ${accessToken}`, accept: "application/json" },
  }).catch(() => null);
  if (!response?.ok) return {};
  const profile = (await response.json().catch(() => ({}))) as { email?: string; name?: string };
  return { email: profile.email, name: profile.name };
};

export const completeGoogleLogin = async (key: SourceKey, code: string): Promise<Result<null>> => {
  const source = findSource(key);
  if (source.error) return source;
  const exchanged = await requestToken({
    grant_type: "authorization_code",
    code,
    code_verifier: source.data.oauth.verifier ?? "",
    redirect_uri: brokerCallbackUrl("google"),
  });
  if (exchanged.error) return exchanged;
  const merged = mergeTokens(source.data.oauth, exchanged.data, Date.now());
  const profile = await fetchProfile(exchanged.data.access_token ?? "");
  const google = { ...merged.google, ...profile } as GoogleOAuthState;
  const saved = updateOAuth(key, { ...merged, google, verifier: undefined });
  if (saved.error) return saved;
  markConnected(key);
  return ok(null);
};

const refreshAccessToken = async (key: SourceKey, oauth: OAuthState, refreshToken: string): Promise<Result<string>> => {
  const refreshed = await requestToken({ grant_type: "refresh_token", refresh_token: refreshToken });
  if (refreshed.error) {
    if ((refreshed.error.details as { error?: string } | undefined)?.error !== "invalid_grant") return refreshed;
    updateOAuth(key, { tokens: undefined, google: { ...oauth.google, scopes: [], expiresAt: undefined } });
    const message = "O Google revogou o acesso. Conecte de novo.";
    updateStatus(key, { status: "needs_auth", error: message });
    return fail("NEEDS_AUTH", message);
  }
  const saved = updateOAuth(key, mergeTokens(oauth, refreshed.data, Date.now()));
  return saved.error ? saved : ok(refreshed.data.access_token ?? "");
};

export const getGoogleAccessToken = async (key: SourceKey): Promise<Result<string>> => {
  const source = findSource(key);
  if (source.error) return source;
  const { tokens, google } = source.data.oauth;
  if (!tokens?.access_token) return fail("NEEDS_AUTH", "Conecte o Google para usar esta conexão.");
  if (!google?.expiresAt || google.expiresAt - GOOGLE_REFRESH_MARGIN_MS > Date.now()) return ok(tokens.access_token);
  if (!tokens.refresh_token) return fail("NEEDS_AUTH", "O acesso ao Google expirou. Conecte de novo.");
  const id = `${key.organizationId}/${key.name}`;
  const pending =
    refreshing.get(id) ??
    refreshAccessToken(key, source.data.oauth, tokens.refresh_token).finally(() => refreshing.delete(id));
  refreshing.set(id, pending);
  return pending;
};
