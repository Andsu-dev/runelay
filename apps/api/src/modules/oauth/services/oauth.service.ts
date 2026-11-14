import { auth } from "@modelcontextprotocol/sdk/client/auth.js";
import { attempt, fail, type McpRemoteConfig, type OAuthStartView, ok, type Result } from "@runelay/shared";
import { connectSource } from "@/modules/connectors/services/connection.service";
import { createOAuthProvider } from "@/modules/oauth/providers/oauth-client.provider";
import { findSource, updateOAuth } from "@/modules/sources/repositories/source.repository";
import type { SourceKey } from "@/modules/sources/types/source.types";
import { guardedFetch } from "@/modules/sources/utils/guarded-fetch";

const findRemoteConfig = (key: SourceKey): Result<McpRemoteConfig> => {
  const source = findSource(key);
  if (source.error) return source;
  if (source.data.config.kind !== "mcp") return fail("OAUTH_UNSUPPORTED");
  return ok(source.data.config);
};

export const startLogin = async (key: SourceKey): Promise<Result<OAuthStartView>> => {
  const config = findRemoteConfig(key);
  if (config.error) return config;
  const current = findSource(key);
  if (current.error) return current;
  const cleared = updateOAuth(
    key,
    current.data.oauth.imported ? { tokens: undefined, client: undefined, imported: undefined } : { tokens: undefined },
  );
  if (cleared.error) return cleared;

  let authorizationUrl: string | null = null;
  const provider = createOAuthProvider(key, (url) => {
    authorizationUrl = url.toString();
  });
  const result = await attempt(
    () => auth(provider, { serverUrl: config.data.url, fetchFn: guardedFetch }),
    "OAUTH_FAILED",
  );
  if (result.error && /HTTP 403/.test(result.error.message)) {
    return fail(
      "OAUTH_FAILED",
      `${key.name} só libera login para apps aprovados por ele, e recusou este runelay. Use essa conta direto no agente.`,
    );
  }
  if (result.error) return result;
  if (result.data === "AUTHORIZED") await connectSource(key);
  return ok({ authorizationUrl });
};

const alreadyConnected = (key: SourceKey) => {
  const source = findSource(key);
  return source.data?.status === "ok" && Boolean(source.data.oauth.tokens);
};

export const completeLogin = async (key: SourceKey, code: string): Promise<Result<null>> => {
  const config = findRemoteConfig(key);
  if (config.error) return config;
  if (alreadyConnected(key)) return ok(null);
  const result = await attempt(
    () =>
      auth(createOAuthProvider(key), { serverUrl: config.data.url, authorizationCode: code, fetchFn: guardedFetch }),
    "OAUTH_FAILED",
  );
  if (result.error) return result;
  const connected = await connectSource(key);
  return connected.error ? connected : ok(null);
};
