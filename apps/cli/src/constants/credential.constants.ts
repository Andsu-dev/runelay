import { cliEnv } from "@/config/env";

const home = cliEnv.RUNELAY_HOME;

export const GROK_CREDENTIALS_FILE = `${home}/.grok/mcp_credentials.json`;

export const CODEX_CREDENTIALS_FILE = `${home}/.codex/.credentials.json`;

export const CLAUDE_CREDENTIALS_FILE = `${home}/.claude/.credentials.json`;

export const CODEX_KEYCHAIN_SERVICE = "Codex MCP Credentials";

export const CLAUDE_KEYCHAIN_SERVICE = "Claude Code-credentials";

export const EPOCH_SECONDS_LIMIT = 1e12;
