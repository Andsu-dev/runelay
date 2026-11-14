import { z } from "zod";
import { EPOCH_SECONDS_LIMIT } from "@/constants/credential.constants";
import type { LocalCredential } from "@/types/credential.types";

const text = z.string().min(1).optional().catch(undefined);
const time = z.union([z.number(), z.string()]).optional().catch(undefined);

const tokenResponseSchema = z.looseObject({
  access_token: text,
  token_type: text,
  expires_in: z.number().optional().catch(undefined),
  refresh_token: text,
  scope: text,
});

const grokEntrySchema = z.looseObject({
  client_id: z.string().min(1),
  client_secret: text,
  token_response: tokenResponseSchema,
  granted_scopes: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .catch(undefined),
  token_received_at: time,
});

const codexEntrySchema = z.looseObject({
  server_name: z.string().min(1),
  url: z.string().min(1),
  client_id: z.string().min(1),
  client_secret: text,
  token_response: tokenResponseSchema,
  expires_at: time,
});

const claudeEntrySchema = z.looseObject({
  serverName: z.string().min(1),
  serverUrl: z.string().min(1),
  clientId: z.string().min(1),
  clientSecret: text,
  accessToken: text,
  refreshToken: text,
  expiresAt: time,
  scope: text,
});

export const toEpochMs = (value: number | string | undefined) => {
  if (value === undefined || value === "") return undefined;
  const numeric = typeof value === "number" ? value : Number(value);
  if (Number.isFinite(numeric)) return numeric < EPOCH_SECONDS_LIMIT ? numeric * 1000 : numeric;
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? undefined : parsed;
};

const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const objectEntries = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value) ? Object.entries(value as Record<string, unknown>) : [];

export const isUsableCredential = (credential: LocalCredential, now = Date.now()) =>
  Boolean(
    credential.refreshToken ||
      (credential.accessToken && (credential.expiresAt === undefined || credential.expiresAt > now)),
  );

export const parseGrokCredentials = (raw: string, now = Date.now()): LocalCredential[] =>
  objectEntries(parseJson(raw)).flatMap(([key, value]) => {
    const match = key.match(/^(.*?):(https?:\/\/.+)$/);
    const entry = grokEntrySchema.safeParse(value);
    if (!match?.[1] || !match[2] || !entry.success) return [];
    const { client_id, client_secret, token_response, granted_scopes, token_received_at } = entry.data;
    const receivedAt = toEpochMs(token_received_at);
    const credential: LocalCredential = {
      agent: "Grok",
      serverName: match[1],
      url: match[2],
      clientId: client_id,
      clientSecret: client_secret,
      accessToken: token_response.access_token,
      refreshToken: token_response.refresh_token,
      expiresAt:
        receivedAt !== undefined && token_response.expires_in !== undefined
          ? receivedAt + token_response.expires_in * 1000
          : undefined,
      scope: token_response.scope ?? (Array.isArray(granted_scopes) ? granted_scopes.join(" ") : granted_scopes),
      tokenType: token_response.token_type,
    };
    return isUsableCredential(credential, now) ? [credential] : [];
  });

const codexCredentialOf = (value: unknown, now: number): LocalCredential[] => {
  const entry = codexEntrySchema.safeParse(value);
  if (!entry.success) return [];
  const { server_name, url, client_id, client_secret, token_response, expires_at } = entry.data;
  const credential: LocalCredential = {
    agent: "Codex",
    serverName: server_name,
    url,
    clientId: client_id,
    clientSecret: client_secret,
    accessToken: token_response.access_token,
    refreshToken: token_response.refresh_token,
    expiresAt: toEpochMs(expires_at),
    scope: token_response.scope,
    tokenType: token_response.token_type,
  };
  return isUsableCredential(credential, now) ? [credential] : [];
};

export const parseCodexCredentials = (raw: string, now = Date.now()): LocalCredential[] => {
  const parsed = parseJson(raw);
  const single = codexCredentialOf(parsed, now);
  if (single.length) return single;
  return objectEntries(parsed).flatMap(([, value]) => codexCredentialOf(value, now));
};

export const parseClaudeCredentials = (raw: string, now = Date.now()): LocalCredential[] => {
  const parsed = parseJson(raw) as { mcpOAuth?: unknown } | null;
  return objectEntries(parsed?.mcpOAuth).flatMap(([, value]) => {
    const entry = claudeEntrySchema.safeParse(value);
    if (!entry.success) return [];
    const credential: LocalCredential = {
      agent: "Claude Code",
      serverName: entry.data.serverName,
      url: entry.data.serverUrl,
      clientId: entry.data.clientId,
      clientSecret: entry.data.clientSecret,
      accessToken: entry.data.accessToken,
      refreshToken: entry.data.refreshToken,
      expiresAt: toEpochMs(entry.data.expiresAt),
      scope: entry.data.scope,
    };
    return isUsableCredential(credential, now) ? [credential] : [];
  });
};
