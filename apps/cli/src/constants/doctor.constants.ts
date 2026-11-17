import type { ClientId } from "@/constants/clients.constants";

export const CONNECTED_CLIENTS: ClientId[] = ["claude", "codex", "grok"];

export const LOCAL_MEMORY_PATTERNS = [
  /memory\//i,
  /MEMORY\.md/,
  /\bvault\b/i,
  /\b(save|write|store)\s+(the\s+|your\s+)?memor(y|ies)\s+(to|in|into)\s+[`'"]?[~./]/i,
  /(grav|salv|escrev)\p{L}*\s+(a\s+|as\s+)?mem[oó]rias?\s+(em|no|na|nos|nas)\s+[`'"]?[~./]/iu,
];

export const NEGATION_PATTERN =
  /(^|[^\p{L}])(nunca|jamais|never|não|nao|don't|dont|do not|proibido|proibida|forbidden|evite|avoid)(?=[^\p{L}]|$)/iu;

export const BLOCK_START_PATTERN = /^\s*([-*+]\s|\d+[.)]\s|#)/;
