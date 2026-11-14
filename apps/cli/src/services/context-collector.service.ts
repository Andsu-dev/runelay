import type { CreateMemoryInput, CreateSkillInput } from "@runeley/shared";
import { cliEnv } from "@/config/env";
import {
  CLAUDE_PROJECTS_DIR,
  CURRENT_PROJECT_MEMORY_DIR,
  EXTRA_MEMORY_SOURCES,
  INSTRUCTION_SOURCES,
  SKILL_SOURCES,
} from "@/constants/context.constants";
import { listMemoryDirectories, readInstructions, readMemories, readSkills } from "@/services/context-reader.service";
import type { CollectedContext, CollectLine } from "@/types/collect.types";

const memoryDirectories = () =>
  cliEnv.RUNELEY_MEMORY_DIR
    ? [{ agent: "Personalizado", path: cliEnv.RUNELEY_MEMORY_DIR }]
    : [
        ...listMemoryDirectories(CLAUDE_PROJECTS_DIR, CURRENT_PROJECT_MEMORY_DIR).map((path) => ({
          agent: "Claude Code",
          path,
        })),
        ...EXTRA_MEMORY_SOURCES,
      ];

export const collectContext = (): CollectedContext => {
  const lines: CollectLine[] = [];
  const memories = new Map<string, CreateMemoryInput>();
  for (const { agent, path } of memoryDirectories()) {
    const found = readMemories(path);
    const fresh = found.filter((memory) => !memories.has(memory.slug));
    for (const memory of fresh) memories.set(memory.slug, memory);
    if (found.length) lines.push({ agent, kind: "memories", added: fresh.length, found: found.length, path });
  }
  if (!cliEnv.RUNELEY_MEMORY_DIR) {
    for (const source of INSTRUCTION_SOURCES) {
      const instructions = readInstructions(source);
      if (!instructions) continue;
      memories.set(instructions.slug, instructions);
      lines.push({ agent: source.agent, kind: "instructions", added: 1, found: 1, path: source.path });
    }
  }
  const skills = new Map<string, CreateSkillInput>();
  for (const { agent, path } of SKILL_SOURCES) {
    const found = readSkills(path);
    const fresh = found.filter((skill) => !skills.has(skill.slug));
    for (const skill of fresh) skills.set(skill.slug, skill);
    if (found.length) lines.push({ agent, kind: "skills", added: fresh.length, found: found.length, path });
  }
  return { memories: [...memories.values()], skills: [...skills.values()], lines };
};
