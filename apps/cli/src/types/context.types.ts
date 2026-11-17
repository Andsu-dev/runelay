import type { ContextClient } from "@runelay/shared";

export interface AgentDirectory {
  agent: string;
  path: string;
}

export interface InstructionFile extends AgentDirectory {
  slug: string;
}

export interface InstructionTarget {
  id: string;
  name: string;
  detect: string;
  file: string;
  client: ContextClient;
}

export interface InstructionTargetDirs {
  configHome?: string;
  kimiHome?: string;
}
