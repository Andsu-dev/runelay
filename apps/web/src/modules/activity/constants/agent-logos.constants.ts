import { CLIENT_SNIPPETS } from "@/modules/api-keys/constants/client-snippets.constants";

const logoOf = (client: string) => CLIENT_SNIPPETS.find((snippet) => snippet.client === client)?.logo ?? null;

export const AGENT_LOGO_MATCHERS = [
  { pattern: /claude/i, logo: logoOf("Claude Code") },
  { pattern: /codex|openai|chatgpt/i, logo: logoOf("Codex") },
  { pattern: /grok/i, logo: logoOf("Grok") },
  { pattern: /cursor/i, logo: logoOf("Cursor") },
];
