import { type CreateMemoryInput, type CreateSkillInput, ok, type Result } from "@runeley/shared";
import { cliEnv } from "@/config/env";
import {
  CLAUDE_PROJECTS_DIR,
  CURRENT_PROJECT_MEMORY_DIR,
  EXTRA_MEMORY_SOURCES,
  INSTRUCTION_SOURCES,
  MEMORY_BATCH_SIZE,
  SKILL_BATCH_SIZE,
  SKILL_SOURCES,
} from "@/constants/context.constants";
import { chunk } from "@/lib/chunk";
import { bold, red } from "@/lib/terminal";
import { resolveConnection } from "@/services/config.service";
import { listMemoryDirectories, readInstructions, readMemories, readSkills } from "@/services/context-reader.service";
import { pushMemories, pushSkills } from "@/services/runeley-api.service";

const collectMemories = () => {
  const bySlug = new Map<string, CreateMemoryInput>();
  const directories = cliEnv.RUNELEY_MEMORY_DIR
    ? [cliEnv.RUNELEY_MEMORY_DIR]
    : [
        ...listMemoryDirectories(CLAUDE_PROJECTS_DIR, CURRENT_PROJECT_MEMORY_DIR),
        ...EXTRA_MEMORY_SOURCES.map((source) => source.path),
      ];
  for (const directory of directories) {
    const found = readMemories(directory);
    let added = 0;
    for (const memory of found) {
      if (bySlug.has(memory.slug)) continue;
      bySlug.set(memory.slug, memory);
      added += 1;
    }
    if (found.length) console.log(`  memórias  ${String(added).padStart(4)} novas de ${found.length} em ${directory}`);
  }
  if (!cliEnv.RUNELEY_MEMORY_DIR) {
    for (const source of INSTRUCTION_SOURCES) {
      const instructions = readInstructions(source);
      if (!instructions) continue;
      bySlug.set(instructions.slug, instructions);
      console.log(`  instruções do ${source.agent} em ${source.path}`);
    }
  }
  return [...bySlug.values()];
};

const collectSkills = () => {
  const bySlug = new Map<string, CreateSkillInput>();
  for (const source of SKILL_SOURCES) {
    const found = readSkills(source.path);
    let added = 0;
    for (const skill of found) {
      if (bySlug.has(skill.slug)) continue;
      bySlug.set(skill.slug, skill);
      added += 1;
    }
    if (found.length)
      console.log(
        `  skills    ${String(added).padStart(4)} novas de ${found.length} no ${source.agent} (${source.path})`,
      );
  }
  return [...bySlug.values()];
};

const pushInBatches = async <T>(
  label: string,
  items: T[],
  size: number,
  push: (batch: T[]) => Promise<Result<{ imported: number }>>,
) => {
  let imported = 0;
  for (const batch of chunk(items, size)) {
    const { data, error } = await push(batch);
    if (error) {
      console.error(red(`${label} falharam: ${error.message}`));
      process.exitCode = 1;
      return null;
    }
    imported += data.imported;
  }
  return imported;
};

export const pushCommand = async (): Promise<Result<null>> => {
  const connection = resolveConnection();
  if (connection.error) return connection;
  console.log(bold("Lendo os agentes instalados:"));
  const memories = collectMemories();
  const skills = collectSkills();
  const pinned = memories.filter((memory) => memory.pinned).length;
  console.log(`\nTotal: ${memories.length} memórias (${pinned} fixadas) e ${skills.length} habilidades.`);

  const importedMemories = await pushInBatches("Memórias", memories, MEMORY_BATCH_SIZE, (batch) =>
    pushMemories(connection.data, batch),
  );
  if (importedMemories === null) return ok(null);
  const importedSkills = await pushInBatches("Habilidades", skills, SKILL_BATCH_SIZE, (batch) =>
    pushSkills(connection.data, batch),
  );
  if (importedSkills === null) return ok(null);
  console.log(`Enviadas ${importedMemories} memórias e ${importedSkills} habilidades.`);
  return ok(null);
};
