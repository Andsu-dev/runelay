import { auth } from "@modelcontextprotocol/sdk/client/auth.js";
import { attempt, fail, type McpRemoteConfig, type OAuthStartView, ok, type Result } from "@runelay/shared";
import { connectSource } from "@/modules/connectors/services/connection.service";
import { completeGoogleLogin, startGoogleLogin } from "@/modules/google/services/google-auth.service";
import { createOAuthFetch, createOAuthProvider } from "@/modules/oauth/providers/oauth-client.provider";
import { relayCallbackUrl } from "@/modules/oauth/utils/oauth-broker";
import { findSource, updateOAuth } from "@/modules/sources/repositories/source.repository";
import type { Source, SourceKey } from "@/modules/sources/types/source.types";

const REDIRECT_REFUSED = /redirect[\s_-]?ur[il]/i;

const runMcpLogin = async (key: SourceKey, config: McpRemoteConfig, relay: boolean) => {
  let authorizationUrl: string | null = null;
  const provider = createOAuthProvider(
    key,
    (url) => {
      authorizationUrl = url.toString();
    },
    { relay },
  );
  const result = await attempt(
    () => auth(provider, { serverUrl: config.url, fetchFn: createOAuthFetch(key) }),
    "OAUTH_FAILED",
  );
  return result.error ? result : ok<OAuthStartView>({ authorizationUrl });
};

const startMcpLogin = async (
  key: SourceKey,
  source: Source,
  config: McpRemoteConfig,
): Promise<Result<OAuthStartView>> => {
  const cleared = updateOAuth(
    key,
    source.oauth.imported ? { tokens: undefined, client: undefined, imported: undefined } : { tokens: undefined },
  );
  if (cleared.error) return cleared;

  const direct = await runMcpLogin(key, config, false);
  const result =
    direct.error && REDIRECT_REFUSED.test(direct.error.message) ? await runMcpLogin(key, config, true) : direct;
  if (result.error && REDIRECT_REFUSED.test(result.error.message)) {
    return fail(
      "OAUTH_FAILED",
      `${key.name} só aceita endereços de retorno aprovados por ele e recusou este runelay. Use "Usar meu próprio cliente OAuth" com um app OAuth seu, ou peça ao provedor para aprovar ${relayCallbackUrl()}.`,
    );
  }
  if (result.error && /HTTP 403/.test(result.error.message)) {
    return fail(
      "OAUTH_FAILED",
      `${key.name} só libera login para apps aprovados por ele, e recusou este runelay. Use essa conta direto no agente.`,
    );
  }
  return result;
};

export const startLogin = async (key: SourceKey): Promise<Result<OAuthStartView>> => {
  const source = findSource(key);
  if (source.error) return source;
  const { config } = source.data;
  if (config.kind !== "mcp" && config.kind !== "google") return fail("OAUTH_UNSUPPORTED");
  const started =
    config.kind === "google" ? startGoogleLogin(key, config) : await startMcpLogin(key, source.data, config);
  if (started.error) return started;
  if (!started.data.authorizationUrl) await connectSource(key);
  return ok({ authorizationUrl: started.data.authorizationUrl });
};

const exchangeMcpCode = async (key: SourceKey, config: McpRemoteConfig, code: string): Promise<Result<unknown>> =>
  attempt(
    () =>
      auth(createOAuthProvider(key), {
        serverUrl: config.url,
        authorizationCode: code,
        fetchFn: createOAuthFetch(key),
      }),
    "OAUTH_FAILED",
  );

export const completeLogin = async (key: SourceKey, code: string): Promise<Result<null>> => {
  const source = findSource(key);
  if (source.error) return source;
  const { config } = source.data;
  if (config.kind !== "mcp" && config.kind !== "google") return fail("OAUTH_UNSUPPORTED");
  if (source.data.status === "ok" && source.data.oauth.tokens) return ok(null);
  const exchanged =
    config.kind === "google" ? await completeGoogleLogin(key, code) : await exchangeMcpCode(key, config, code);
  if (exchanged.error) return exchanged;
  const connected = await connectSource(key);
  return connected.error ? connected : ok(null);
};
