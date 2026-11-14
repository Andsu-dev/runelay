import type { CreateMemoryInput, CreateSkillInput, Result } from "@runeley/shared";
import { ok } from "@runeley/shared";
import { MEMORY_BATCH_SIZE, SKILL_BATCH_SIZE } from "@/constants/context.constants";
import { chunk } from "@/lib/chunk";
import { pushMemories, pushSkills } from "@/services/runeley-api.service";
import type { Connection } from "@/types/config.types";

const pushInBatches = async <T>(
  items: T[],
  size: number,
  push: (batch: T[]) => Promise<Result<{ imported: number }>>,
): Promise<Result<number>> => {
  let imported = 0;
  for (const batch of chunk(items, size)) {
    const pushed = await push(batch);
    if (pushed.error) return pushed;
    imported += pushed.data.imported;
  }
  return ok(imported);
};

export const pushContext = async (
  connection: Connection,
  memories: CreateMemoryInput[],
  skills: CreateSkillInput[],
): Promise<Result<{ memories: number; skills: number }>> => {
  const pushedMemories = await pushInBatches(memories, MEMORY_BATCH_SIZE, (batch) => pushMemories(connection, batch));
  if (pushedMemories.error) return pushedMemories;
  const pushedSkills = await pushInBatches(skills, SKILL_BATCH_SIZE, (batch) => pushSkills(connection, batch));
  if (pushedSkills.error) return pushedSkills;
  return ok({ memories: pushedMemories.data, skills: pushedSkills.data });
};
