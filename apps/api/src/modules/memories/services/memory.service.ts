import {
  type CreateMemoryInput,
  type ImportMemoriesInput,
  type MemoryView,
  ok,
  type Result,
  type UpdateMemoryInput,
} from "@runeley/shared";
import {
  findMemory,
  insertMemory,
  memoryExists,
  updateMemoryRow,
  upsertMemories,
} from "@/modules/memories/repositories/memory.repository";
import type { MemoryWriteInput } from "@/modules/memories/types/memory.types";

export {
  deleteMemoryRow as deleteMemory,
  describeHealth as describeMemoryHealth,
  findMemory,
  listMemories,
  listVersions as listMemoryVersions,
} from "@/modules/memories/repositories/memory.repository";

export const createMemory = (organizationId: string, input: CreateMemoryInput): Result<MemoryView> => {
  const created = insertMemory(organizationId, input);
  return created.error ? created : findMemory(organizationId, input.slug);
};

export const updateMemory = (organizationId: string, slug: string, input: UpdateMemoryInput): Result<MemoryView> => {
  const updated = updateMemoryRow(organizationId, slug, input);
  return updated.error ? updated : findMemory(organizationId, slug);
};

export const writeMemory = (organizationId: string, { slug, ...fields }: MemoryWriteInput): Result<MemoryView> => {
  const exists = memoryExists(organizationId, slug);
  if (exists.error) return exists;
  if (exists.data) return updateMemory(organizationId, slug, fields);
  return createMemory(organizationId, {
    slug,
    name: fields.name ?? slug,
    description: fields.description ?? "",
    type: fields.type ?? "project",
    body: fields.body,
    pinned: false,
  });
};

export const importMemories = (organizationId: string, { memories }: ImportMemoriesInput) => {
  const imported = upsertMemories(organizationId, memories);
  return imported.error ? imported : ok({ imported: imported.data });
};
