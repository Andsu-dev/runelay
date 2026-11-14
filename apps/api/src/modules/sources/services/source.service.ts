import {
  type CreateSourceInput,
  type ImportSourcesInput,
  type ImportView,
  ok,
  type Result,
  type SourceView,
  type UpdateSourceInput,
} from "@runeley/shared";
import { parseClientConfig } from "@runeley/shared/importers";
import { connectSource, disconnectSource } from "@/modules/connectors/services/connection.service";
import {
  deleteSource,
  findSource,
  findSourceView,
  updateEnabled,
  upsertSource,
  upsertSources,
} from "@/modules/sources/repositories/source.repository";
import { checkSourcePolicy } from "@/modules/sources/services/source-policy.service";
import type { SourceKey } from "@/modules/sources/types/source.types";
import type { SourceActor } from "@/modules/sources/types/source-policy.types";

export { findSourceView, listSourceViews, summarizeSources } from "@/modules/sources/repositories/source.repository";

export const createSource = async (
  organizationId: string,
  input: CreateSourceInput,
  actor: SourceActor,
): Promise<Result<SourceView>> => {
  const allowed = await checkSourcePolicy(input.config, actor);
  if (allowed.error) return allowed;
  const saved = upsertSource(organizationId, input);
  if (saved.error) return saved;
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
    const saved = upsertSource(key.organizationId, { name: key.name, config: input.config });
    if (saved.error) return saved;
  }
  if (input.enabled !== undefined) {
    const toggled = updateEnabled(key, input.enabled);
    if (toggled.error) return toggled;
  }
  if (input.enabled === false) await disconnectSource(key);
  else await connectSource(key);
  return findSourceView(key);
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

export const importSources = async (
  organizationId: string,
  input: ImportSourcesInput,
  actor: SourceActor,
): Promise<Result<ImportView>> => {
  const parsed = "config" in input ? parseClientConfig(input.config, {}) : ok(input.sources);
  if (parsed.error) return parsed;
  const checks = await Promise.all(parsed.data.map((source) => checkSourcePolicy(source.config, actor)));
  const allowed = parsed.data.filter((_, index) => !checks[index]?.error);
  const skipped = parsed.data.flatMap((source, index) => {
    const reason = checks[index]?.error?.message;
    return reason ? [{ name: source.name, reason }] : [];
  });
  const saved = upsertSources(organizationId, allowed);
  if (saved.error) return saved;
  await Promise.all(allowed.map((source) => connectSource({ organizationId, name: source.name })));
  return ok({ imported: allowed.map((source) => source.name), skipped });
};
