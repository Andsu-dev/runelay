import { join } from "node:path";
import { cliEnv } from "@/config/env";
import type { ManualMemoryStep, NativeMemoryTarget } from "@/types/native-memory.types";

export const nativeMemoryTargetsFor = (home: string): NativeMemoryTarget[] => [
  {
    agent: "Claude Code",
    detect: [join(home, ".claude")],
    file: join(home, ".claude", "settings.json"),
    format: "json",
    settings: [{ key: "autoMemoryEnabled", value: false }],
  },
  {
    agent: "Codex",
    detect: [join(home, ".codex")],
    file: join(home, ".codex", "config.toml"),
    format: "toml",
    settings: [
      { key: "features.memories", value: false },
      { key: "memories.generate_memories", value: false },
      { key: "memories.use_memories", value: false },
    ],
  },
  {
    agent: "Grok",
    detect: [join(home, ".grok")],
    file: join(home, ".grok", "config.toml"),
    format: "toml",
    settings: [
      { key: "memory.enabled", value: false },
      { key: "memory_v2.enabled", value: false },
    ],
  },
  {
    agent: "Gemini",
    detect: [join(home, ".gemini", "settings.json")],
    file: join(home, ".gemini", "settings.json"),
    format: "json",
    settings: [
      { key: "experimental.autoMemory", value: false },
      { key: "tools.exclude", value: "save_memory", mode: "include" },
    ],
  },
  {
    agent: "Hermes Agent",
    detect: [join(home, ".hermes")],
    file: join(home, ".hermes", "config.yaml"),
    format: "yaml",
    settings: [
      { key: "memory.memory_enabled", value: false },
      { key: "memory.user_profile_enabled", value: false },
    ],
  },
  {
    agent: "OpenClaw",
    detect: [join(home, ".openclaw")],
    file: join(home, ".openclaw", "openclaw.json"),
    format: "json",
    settings: [{ key: "plugins.slots.memory", value: "none" }],
  },
  {
    agent: "MausBot",
    detect: [join(home, ".openmausbot")],
    file: join(home, ".openmausbot", "config.json"),
    format: "json",
    settings: [{ key: "features.autoRecall", value: false }],
  },
];

export const manualMemoryStepsFor = (home: string): ManualMemoryStep[] => [
  {
    agent: "Antigravity",
    detect: [join(home, ".gemini", "antigravity"), join(home, ".gemini", "config", "mcp_config.json")],
    step: "Knowledge Items have no config key; review or delete them in the Agent Manager",
  },
];

export const NATIVE_MEMORY_TARGETS = nativeMemoryTargetsFor(cliEnv.RUNELAY_HOME);

export const MANUAL_MEMORY_STEPS = manualMemoryStepsFor(cliEnv.RUNELAY_HOME);

export const ARCHIVE_DIR = join(cliEnv.RUNELAY_HOME, ".runelay", "archive");
