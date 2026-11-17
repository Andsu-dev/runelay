import { cliEnv } from "@/config/env";

const home = cliEnv.RUNELAY_HOME;

export const CLIENT_CONFIG_FILES = {
  claude: `${home}/.claude.json`,
  codex: `${home}/.codex/config.toml`,
  grok: `${home}/.grok/config.toml`,
  cursor: `${home}/.cursor/mcp.json`,
  gemini: `${home}/.gemini/settings.json`,
  opencode: `${home}/.config/opencode/opencode.json`,
} as const;

export type ClientId = keyof typeof CLIENT_CONFIG_FILES;

export const CLIENT_AGENT_LABELS: Record<ClientId, string> = {
  claude: "Claude Code",
  codex: "Codex",
  grok: "Grok",
  cursor: "Cursor",
  gemini: "Gemini",
  opencode: "OpenCode",
};

export const TOML_HEADER_KEYS = { codex: "http_headers", grok: "headers" } as const;

export const TOML_RUNELAY_HEADER = "[mcp_servers.runelay]";

export const JSON_SERVER_KEYS = ["mcpServers", "servers", "mcp"] as const;

export const CURSOR_CLI_CONFIG = `${home}/.cursor/cli-config.json`;

export const CLAUDE_SETTINGS_FILE = `${home}/.claude/settings.json`;

export const CURSOR_CLI_COMMAND = "cursor-agent";
