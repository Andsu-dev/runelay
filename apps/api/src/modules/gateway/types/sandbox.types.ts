export interface SandboxLimits {
  memoryBytes: number;
  maxStackBytes: number;
  maxLogChars: number;
  cpuMs: number;
  wallMs: number;
}

export type SandboxStop = "cpu" | "wall";
