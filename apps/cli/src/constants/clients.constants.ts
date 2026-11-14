import { cliEnv } from "@/config/env";

const home = cliEnv.RUNELEY_HOME;

export const CLIENT_CONFIG_FILES = {
  claude: `${home}/.claude.json`,
  codex: `${home}/.codex/config.toml`,
  grok: `${home}/.grok/config.toml`,
  cursor: `${home}/.cursor/mcp.json`,
} as const;

export const TOML_HEADER_KEYS = { codex: "http_headers", grok: "headers" } as const;

export const TOML_RUNELEY_HEADER = "[mcp_servers.runeley]";
