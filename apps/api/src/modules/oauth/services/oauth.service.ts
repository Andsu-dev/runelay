import { auth } from "@modelcontextprotocol/sdk/client/auth.js";
import { attempt, fail, type McpRemoteConfig, type OAuthStartView, ok, type Result } from "@runeley/shared";
import { connectSource } from "@/modules/connectors/services/connection.service";
import { createOAuthProvider } from "@/modules/oauth/providers/oauth-client.provider";
import { findSource, updateOAuth } from "@/modules/sources/repositories/source.repository";
import type { SourceKey } from "@/modules/sources/types/source.types";

const findRemoteConfig = (key: SourceKey): Result<McpRemoteConfig> => {
  const source = findSource(key);
  if (source.error) return source;
  if (source.data.config.kind !== "mcp") return fail("OAUTH_UNSUPPORTED");
  return ok(source.data.config);
};

export const startLogin = async (key: SourceKey): Promise<Result<OAuthStartView>> => {
  const config = findRemoteConfig(key);
  if (config.error) return config;
  const cleared = updateOAuth(key, { tokens: undefined });
  if (cleared.error) return cleared;

  let authorizationUrl: string | null = null;
  const provider = createOAuthProvider(key, (url) => {
    authorizationUrl = url.toString();
  });
  const result = await attempt(() => auth(provider, { serverUrl: config.data.url }), "OAUTH_FAILED");
  if (result.error) return result;
  if (result.data === "AUTHORIZED") await connectSource(key);
  return ok({ authorizationUrl });
};

export const completeLogin = async (key: SourceKey, code: string): Promise<Result<null>> => {
  const config = findRemoteConfig(key);
  if (config.error) return config;
  const result = await attempt(
    () => auth(createOAuthProvider(key), { serverUrl: config.data.url, authorizationCode: code }),
    "OAUTH_FAILED",
  );
  if (result.error) return result;
  const connected = await connectSource(key);
  return connected.error ? connected : ok(null);
};
