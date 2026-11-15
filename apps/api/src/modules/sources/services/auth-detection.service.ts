import { LATEST_PROTOCOL_VERSION } from "@modelcontextprotocol/sdk/types.js";
import { ok, type Result, type SourceAuthDetectionView, type SourceAuthKind } from "@runelay/shared";
import { CLIENT_INFO } from "@/modules/connectors/constants/connector.constants";
import { AUTH_DETECTION_TIMEOUT_MS } from "@/modules/sources/constants/network.constants";
import { guardedFetch } from "@/modules/sources/utils/guarded-fetch";

const INITIALIZE_REQUEST = JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: { protocolVersion: LATEST_PROTOCOL_VERSION, capabilities: {}, clientInfo: CLIENT_INFO },
});

const challengesOAuth = (challenge: string | null) =>
  Boolean(challenge && /^\s*bearer\b/i.test(challenge) && /resource_metadata\s*=\s*"?[^",\s]+/i.test(challenge));

const metadataUrlsOf = (url: URL) => {
  const path = url.pathname.replace(/\/+$/, "");
  const root = `${url.origin}/.well-known/oauth-protected-resource`;
  return path ? [`${root}${path}`, root] : [root];
};

const isProtectedResourceMetadata = async (url: string, signal: AbortSignal) => {
  const response = await guardedFetch(url, { headers: { accept: "application/json" }, signal }).catch(() => null);
  if (!response?.ok) return false;
  const body = (await response.json().catch(() => null)) as { authorization_servers?: unknown } | null;
  return Array.isArray(body?.authorization_servers) && body.authorization_servers.length > 0;
};

const classify = async (url: URL, signal: AbortSignal): Promise<SourceAuthKind> => {
  const response = await guardedFetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: INITIALIZE_REQUEST,
    signal,
  });
  await response.body?.cancel().catch(() => undefined);
  if (response.ok) return "none";
  if (response.status !== 401 && response.status !== 403) return "unknown";
  if (challengesOAuth(response.headers.get("www-authenticate"))) return "oauth";
  const found = await Promise.all(
    metadataUrlsOf(url).map((candidate) => isProtectedResourceMetadata(candidate, signal)),
  );
  return found.some(Boolean) ? "oauth" : "header";
};

export const detectSourceAuth = async (url: string): Promise<Result<SourceAuthDetectionView>> => {
  const auth = await classify(new URL(url), AbortSignal.timeout(AUTH_DETECTION_TIMEOUT_MS)).catch(
    (): SourceAuthKind => "unknown",
  );
  return ok({ auth });
};
