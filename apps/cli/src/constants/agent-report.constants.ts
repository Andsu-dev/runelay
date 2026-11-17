import { join } from "node:path";
import type { AgentSpec } from "@/types/json-report.types";

export const agentSpecsFor = (home: string): AgentSpec[] => [
  {
    id: "claude",
    name: "Claude Code",
    detect: [join(home, ".claude"), join(home, ".claude.json")],
    command: "claude",
    mcpFile: join(home, ".claude.json"),
    mcpFormat: "json",
  },
  {
    id: "codex",
    name: "Codex",
    detect: [join(home, ".codex")],
    mcpFile: join(home, ".codex", "config.toml"),
    mcpFormat: "toml",
  },
  {
    id: "grok",
    name: "Grok",
    detect: [join(home, ".grok")],
    mcpFile: join(home, ".grok", "config.toml"),
    mcpFormat: "toml",
  },
  { id: "cursor", name: "Cursor", detect: [join(home, ".cursor")] },
  { id: "gemini", name: "Gemini", detect: [join(home, ".gemini", "settings.json")] },
  {
    id: "antigravity",
    name: "Antigravity",
    detect: [join(home, ".gemini", "antigravity"), join(home, ".gemini", "config", "mcp_config.json")],
  },
  { id: "opencode", name: "OpenCode", detect: [join(home, ".config", "opencode")] },
  { id: "hermes", name: "Hermes Agent", detect: [join(home, ".hermes")] },
  { id: "openclaw", name: "OpenClaw", detect: [join(home, ".openclaw")] },
  { id: "mausbot", name: "MausBot", detect: [join(home, ".openmausbot")] },
  { id: "kimi", name: "Kimi Code", detect: [join(home, ".kimi-code")] },
];
