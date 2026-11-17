import {
  type CreateMemoryInput,
  type ImportMemoriesInput,
  type MemoryView,
  type MemoryWriteInput,
  memoryImportItemSchema,
  ok,
  type Result,
  type UpdateMemoryInput,
} from "@runelay/shared";
import { searchContext } from "@/modules/context/services/context.service";
import { SIMILAR_HINT, SIMILAR_LIMIT, SIMILAR_TOKEN } from "@/modules/memories/constants/memory.constants";
import {
  findMemory,
  insertMemory,
  memoryExists,
  updateMemoryRow,
  upsertMemories,
} from "@/modules/memories/repositories/memory.repository";
import type {
  MemoryImportItemView,
  MemoryImportView,
  MemoryWriteView,
  RawMemoryImportItem,
  SimilarMemoryView,
} from "@/modules/memories/types/memory.types";

export {
  deleteMemoryRow as deleteMemory,
  describeGraph as describeMemoryGraph,
  describeHealth as describeMemoryHealth,
  findMemory,
  listMemories,
  listVersions as listMemoryVersions,
} from "@/modules/memories/repositories/memory.repository";

export const createMemory = (
  organizationId: string,
  input: CreateMemoryInput,
  createdAt: string | null = null,
): Result<MemoryView> => {
  const created = insertMemory(organizationId, input, createdAt);
  return created.error ? created : findMemory(organizationId, input.slug);
};

export const updateMemory = (organizationId: string, slug: string, input: UpdateMemoryInput): Result<MemoryView> => {
  const updated = updateMemoryRow(organizationId, slug, input);
  return updated.error ? updated : findMemory(organizationId, slug);
};

export const findSimilarMemories = (
  organizationId: string,
  { slug, name, description }: MemoryWriteInput,
): SimilarMemoryView[] => {
  const query = `${name ?? slug.replaceAll("-", " ")} ${description ?? ""}`.match(SIMILAR_TOKEN)?.join(" ");
  if (!query) return [];
  const hits = searchContext(organizationId, { query, kind: "memory", limit: SIMILAR_LIMIT + 1 });
  return (hits.data ?? [])
    .filter((hit) => hit.slug !== slug)
    .slice(0, SIMILAR_LIMIT)
    .map((hit) => ({ slug: hit.slug, name: hit.name }));
};

export const writeMemory = (
  organizationId: string,
  input: MemoryWriteInput,
  createdAt?: string,
): Result<MemoryWriteView> => {
  const { slug, ...fields } = input;
  const exists = memoryExists(organizationId, slug);
  if (exists.error) return exists;
  if (exists.data) return updateMemory(organizationId, slug, fields);
  const similar = findSimilarMemories(organizationId, input);
  const created = createMemory(
    organizationId,
    {
      slug,
      name: fields.name ?? slug,
      description: fields.description ?? "",
      type: fields.type ?? "project",
      body: fields.body,
      pinned: false,
    },
    createdAt ? new Date(createdAt).toISOString() : null,
  );
  if (created.error || similar.length === 0) return created;
  return ok({ ...created.data, similar, hint: SIMILAR_HINT });
};

const importMemoryItem = (organizationId: string, item: RawMemoryImportItem): MemoryImportItemView => {
  const parsed = memoryImportItemSchema.safeParse(item);
  if (!parsed.success) {
    return { slug: item.slug, status: "failed", error: parsed.error.issues.map((issue) => issue.message).join("; ") };
  }
  const { createdAt, ...input } = parsed.data;
  const existing = findMemory(organizationId, input.slug);
  if (existing.data?.body === input.body) return { slug: input.slug, status: "skipped" };
  if (existing.error && existing.error.code !== "MEMORY_NOT_FOUND") {
    return { slug: input.slug, status: "failed", error: existing.error.message };
  }
  const written = writeMemory(organizationId, input, createdAt);
  if (written.error) return { slug: input.slug, status: "failed", error: written.error.message };
  const { similar } = written.data;
  return { slug: input.slug, status: existing.data ? "updated" : "created", ...(similar ? { similar } : {}) };
};

export const importMemoryItems = (organizationId: string, items: RawMemoryImportItem[]): MemoryImportView => {
  const results = items.map((item) => importMemoryItem(organizationId, item));
  const count = (status: MemoryImportItemView["status"]) => results.filter((item) => item.status === status).length;
  return {
    created: count("created"),
    updated: count("updated"),
    skipped: count("skipped"),
    failed: count("failed"),
    items: results,
    ...(results.some((item) => item.similar) ? { hint: SIMILAR_HINT } : {}),
  };
};

export const importMemories = (organizationId: string, { memories }: ImportMemoriesInput) =>
  upsertMemories(organizationId, memories);
