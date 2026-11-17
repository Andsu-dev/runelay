import type { ClientId } from "@/constants/clients.constants";
import type { InstructionFile } from "@/types/context.types";
import type { McpTarget } from "@/types/mcp-target.types";
import type { ManualMemoryStep, NativeMemoryTarget } from "@/types/native-memory.types";

export interface DoctorCheck {
  status: "ok" | "warn" | "info";
  label: string;
  details: string[];
  fix?: string;
  kind?: string;
  paths?: string[];
}

export interface DoctorInput {
  nativeMemory: NativeMemoryTarget[];
  manualMemory: ManualMemoryStep[];
  manualInstructions?: { agent: string; detect: string; step: string }[];
  clientConfigs: Partial<Record<ClientId, string>>;
  mcpTargets: McpTarget[];
  instructionFiles: InstructionFile[];
  projectsDir: string;
  extraMemoryDirs: string[];
  skillDirs: string[];
  lastPushAt: number | null;
}

export interface InstructionConflict {
  path: string;
  line: number;
  text: string;
}
