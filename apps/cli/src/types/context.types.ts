export interface AgentDirectory {
  agent: string;
  path: string;
}

export interface InstructionFile extends AgentDirectory {
  slug: string;
}
