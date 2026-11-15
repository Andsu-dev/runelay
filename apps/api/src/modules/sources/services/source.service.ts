import {
  type CreateSourceInput,
  fail,
  type ImportedOAuthInput,
  type ImportSourceInput,
  type ImportSourcesInput,
  type ImportView,
  ok,
  type Result,
  type SourceView,
  type UpdateSourceInput,
} from "@runelay/shared";
import { parseClientConfig } from "@runelay/shared/importers";
import { connectSource, disconnectSource } from "@/modules/connectors/services/connection.service";
import {
  deleteSource,
  findSource,
  findSourceView,
  renameSource,
  updateEnabled,
  updateOAuth,
  upsertSource,
  upsertSources,
} from "@/modules/sources/repositories/source.repository";
import { checkSourcePolicy } from "@/modules/sources/services/source-policy.service";
import type { OAuthState, SourceKey } from "@/modules/sources/types/source.types";
import type { SourceActor } from "@/modules/sources/types/source-policy.types";

export { findSourceView, listSourceViews, summarizeSources } from "@/modules/sources/repositories/source.repository";

export const createSource = async (
  organizationId: string,
  input: CreateSourceInput,
  actor: SourceActor,
  oauth?: Partial<OAuthState>,
): Promise<Result<SourceView>> => {
  const allowed = await checkSourcePolicy(input.config, actor);
  if (allowed.error) return allowed;
  const saved = upsertSource(organizationId, input);
  if (saved.error) return saved;
  if (oauth) updateOAuth({ organizationId, name: input.name }, oauth);
  await connectSource({ organizationId, name: input.name });
  return findSourceView({ organizationId, name: input.name });
};

export const updateSource = async (
  key: SourceKey,
  input: UpdateSourceInput,
  actor: SourceActor,
): Promise<Result<SourceView>> => {
  const current = findSource(key);
  if (current.error) return current;
  if (input.config) {
    const allowed = await checkSourcePolicy(input.config, actor);
    if (allowed.error) return allowed;
  }
  const renamed = await renameTo(key, input.name);
  if (renamed.error) return renamed;
  const target = renamed.data;
  if (input.config) {
    const saved = upsertSource(target.organizationId, { name: target.name, config: input.config });
    if (saved.error) return saved;
  }
  if (input.enabled !== undefined) {
    const toggled = updateEnabled(target, input.enabled);
    if (toggled.error) return toggled;
  }
  const renameOnly = input.config === undefined && input.enabled === undefined;
  if (input.enabled === false) await disconnectSource(target);
  else if (!renameOnly || current.data.enabled) await connectSource(target);
  return findSourceView(target);
};

const renameTo = async (key: SourceKey, name: string | undefined): Promise<Result<SourceKey>> => {
  if (name === undefined || name === key.name) return ok(key);
  const target = { organizationId: key.organizationId, name };
  const taken = findSource(target);
  if (!taken.error) return fail("ALREADY_EXISTS", `Já existe uma conexão chamada "${name}".`);
  if (taken.error.code !== "SOURCE_NOT_FOUND") return taken;
  await disconnectSource(key);
  const renamed = renameSource(key, name);
  return renamed.error ? renamed : ok(target);
};

export const testSource = async (key: SourceKey): Promise<Result<SourceView>> => {
  await connectSource(key);
  return findSourceView(key);
};

export const removeSource = async (key: SourceKey): Promise<Result<null>> => {
  const current = findSource(key);
  if (current.error) return current;
  await disconnectSource(key);
  return deleteSource(key);
};

const oauthStateFromImport = (oauth: ImportedOAuthInput, now = Date.now()): OAuthState => {
  const expiresIn = oauth.expiresAt ? Math.floor((oauth.expiresAt - now) / 1000) : undefined;
  return {
    client: { client_id: oauth.clientId, ...(oauth.clientSecret ? { client_secret: oauth.clientSecret } : {}) },
    tokens: {
      access_token: oauth.accessToken ?? "",
      token_type: oauth.tokenType ?? "Bearer",
      ...(oauth.refreshToken ? { refresh_token: oauth.refreshToken } : {}),
      ...(oauth.scope ? { scope: oauth.scope } : {}),
      ...(expiresIn !== undefined && expiresIn > 0 ? { expires_in: expiresIn } : {}),
    },
    verifier: undefined,
    imported: true,
  };
};

const importOne = async (organizationId: string, source: ImportSourceInput) => {
  const key = { organizationId, name: source.name };
  if (source.oauth && source.config.kind === "mcp") {
    const stored = updateOAuth(key, oauthStateFromImport(source.oauth));
    if (stored.error) return false;
  }
  const connected = await connectSource(key);
  return !connected.error;
};

export const importSources = async (
  organizationId: string,
  input: ImportSourcesInput,
  actor: SourceActor,
): Promise<Result<ImportView>> => {
  const parsed: Result<ImportSourceInput[]> =
    "config" in input ? parseClientConfig(input.config, {}) : ok(input.sources);
  if (parsed.error) return parsed;
  const checks = await Promise.all(parsed.data.map((source) => checkSourcePolicy(source.config, actor)));
  const permitted = parsed.data.filter((_, index) => !checks[index]?.error);
  const alreadyConnected = new Set(
    permitted
      .filter((source) => findSourceView({ organizationId, name: source.name }).data?.status === "ok")
      .map((source) => source.name),
  );
  const allowed = permitted.filter((source) => !alreadyConnected.has(source.name));
  const skipped = parsed.data.flatMap((source, index) => {
    const reason = checks[index]?.error?.message;
    return reason ? [{ name: source.name, reason }] : [];
  });
  const saved = upsertSources(
    organizationId,
    allowed.map(({ name, config }) => ({ name, config })),
  );
  if (saved.error) return saved;
  const results = await Promise.all(allowed.map((source) => importOne(organizationId, source)));
  return ok({
    imported: permitted.map((source) => source.name),
    connected: [...alreadyConnected, ...allowed.filter((_, index) => results[index]).map((source) => source.name)],
    skipped,
  });
};
