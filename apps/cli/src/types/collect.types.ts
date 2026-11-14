import type { CreateMemoryInput, CreateSkillInput } from "@runeley/shared";

export interface CollectLine {
  agent: string;
  kind: "memories" | "skills" | "instructions";
  added: number;
  found: number;
  path: string;
}

export interface CollectedContext {
  memories: CreateMemoryInput[];
  skills: CreateSkillInput[];
  lines: CollectLine[];
}
