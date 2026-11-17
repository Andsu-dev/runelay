import type { Result } from "@runelay/shared";

export interface NativeMemorySetting {
  key: string;
  value: boolean | string;
  mode?: "set" | "include";
}

export interface NativeMemoryTarget {
  agent: string;
  detect: string[];
  file: string;
  format: "json" | "toml" | "yaml";
  settings: NativeMemorySetting[];
}

export interface ManualMemoryStep {
  agent: string;
  detect: string[];
  step: string;
}

export interface NativeMemoryOutcome {
  target: NativeMemoryTarget;
  result: Result<string[]>;
}
