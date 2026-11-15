export const API_KEY_PREFIX = "rnl_";

export const AUTH_BASE_PATH = "/v1/auth";

export const SIGNUP_CLOSED_MESSAGE = "Os cadastros estão fechados. Peça acesso a quem administra este runelay.";

export const PERSONAL_ORGANIZATION_NAME = "Pessoal";

export const PERSONAL_SLUG_FALLBACK = "pessoal";

export const API_KEY_ACTIONS = ["create", "read", "update", "delete"] as const;

export const SETUP_TOKEN_REQUIRED_MESSAGE =
  "Para criar a primeira conta, use o link de primeiro acesso que aparece no log do servidor ou no fim da instalação.";
export const RATE_LIMIT_WINDOW_MS = 60_000;

export const MCP_PATH = "/v1/mcp";

export const PROFILE_INVALID_MESSAGE = "Nome ou foto inválidos. A foto precisa ser uma imagem de até 400 KB.";

export const ORGANIZATION_DATA_TABLES = [
  "sources",
  "tool_calls",
  "memories",
  "memory_versions",
  "memory_links",
  "memories_fts",
  "skills",
  "skill_files",
  "skills_fts",
  "api_key_secrets",
  "audit_events",
  "cli_auth_requests",
] as const;
