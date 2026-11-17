import type { ImportedMemoryInput, ImportedSkillInput } from "@runelay/shared";

export interface CollectLine {
  agent: string;
  kind: "memories" | "skills" | "instructions";
  added: number;
  found: number;
  path: string;
}

export interface CollectedContext {
  memories: ImportedMemoryInput[];
  skills: ImportedSkillInput[];
  lines: CollectLine[];
}
