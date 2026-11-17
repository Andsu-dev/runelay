import type { ImportedMemoryInput, ImportedSkillInput, ImportResultView, Result } from "@runelay/shared";
import { ok } from "@runelay/shared";
import { MEMORY_BATCH_SIZE, SKILL_BATCH_SIZE } from "@/constants/context.constants";
import { chunk } from "@/lib/chunk";
import { pushMemories, pushSkills } from "@/services/runelay-api.service";
import type { Connection } from "@/types/config.types";

type PushedBatch = Partial<ImportResultView>;

export const summarizeBatch = (batch: PushedBatch): ImportResultView => {
  const unchanged = batch.unchanged ?? [];
  const imported = batch.imported ?? 0;
  return {
    imported,
    written: batch.written ?? imported - unchanged.length,
    skipped: batch.skipped ?? [],
    unchanged,
  };
};

const pushInBatches = async <T>(
  items: T[],
  size: number,
  push: (batch: T[]) => Promise<Result<PushedBatch>>,
): Promise<Result<ImportResultView>> => {
  const total: ImportResultView = { imported: 0, written: 0, skipped: [], unchanged: [] };
  for (const batch of chunk(items, size)) {
    const pushed = await push(batch);
    if (pushed.error) return pushed;
    const { imported, written, skipped, unchanged } = summarizeBatch(pushed.data);
    total.imported += imported;
    total.written += written;
    total.skipped.push(...skipped);
    total.unchanged.push(...unchanged);
  }
  return ok(total);
};

export const pushContext = async (
  connection: Connection,
  memories: ImportedMemoryInput[],
  skills: ImportedSkillInput[],
): Promise<Result<{ memories: ImportResultView; skills: ImportResultView }>> => {
  const pushedMemories = await pushInBatches(memories, MEMORY_BATCH_SIZE, (batch) => pushMemories(connection, batch));
  if (pushedMemories.error) return pushedMemories;
  const pushedSkills = await pushInBatches(skills, SKILL_BATCH_SIZE, (batch) => pushSkills(connection, batch));
  if (pushedSkills.error) return pushedSkills;
  return ok({ memories: pushedMemories.data, skills: pushedSkills.data });
};
