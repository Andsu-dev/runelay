import type { ErrorCode } from "@runelay/shared";

export interface ErrorHint {
  why: string;
  fix: string;
}

const SIGN_IN_AGAIN: ErrorHint = { why: "This computer has no valid runelay key.", fix: "runelay login" };

const SERVER_UNREACHABLE: ErrorHint = {
  why: "The runelay server didn't answer the way the CLI expected.",
  fix: "runelay status",
};

const TOO_FAST: ErrorHint = { why: "Too many attempts in a short time.", fix: "wait a minute and run it again" };

export const ERROR_HINTS: Partial<Record<ErrorCode, ErrorHint>> = {
  UNAUTHORIZED: SIGN_IN_AGAIN,
  API_KEY_REQUIRED: SIGN_IN_AGAIN,
  API_KEY_NOT_FOUND: SIGN_IN_AGAIN,
  SESSION_REQUIRED: SIGN_IN_AGAIN,
  FORBIDDEN: { why: "This key isn't allowed to do that.", fix: "runelay login" },
  CLI_AUTH_NOT_FOUND: { why: "The sign-in code expired before it was approved.", fix: "runelay login" },
  UPSTREAM_FAILED: SERVER_UNREACHABLE,
  CONNECTION_FAILED: SERVER_UNREACHABLE,
  RATE_LIMITED: TOO_FAST,
  CLI_AUTH_RATE_LIMITED: TOO_FAST,
  STORAGE_FAILED: {
    why: "A file on this computer couldn't be written.",
    fix: "check the folder permissions, then run the command again",
  },
  INVALID_INPUT: { why: "The command got something it can't use.", fix: "runelay help" },
  NOT_FOUND: { why: "The server doesn't have what was asked for.", fix: "runelay status" },
};

export const FALLBACK_ERROR_HINT: ErrorHint = {
  why: "Something unexpected happened inside the CLI.",
  fix: "run it again with --verbose for details",
};

export const UNKNOWN_COMMAND_HINT: ErrorHint = { why: "runelay has no command with that name.", fix: "runelay help" };

export const COMMAND_ICONS: Record<string, { unicode: string; ascii: string }> = {
  setup: { unicode: "▶", ascii: ">" },
  login: { unicode: "◎", ascii: "@" },
  connect: { unicode: "◆", ascii: "*" },
  migrate: { unicode: "◈", ascii: "#" },
  push: { unicode: "↑", ascii: "^" },
  pull: { unicode: "↓", ascii: "v" },
  sync: { unicode: "↻", ascii: "~" },
  status: { unicode: "●", ascii: "o" },
  doctor: { unicode: "◇", ascii: "%" },
  open: { unicode: "↗", ascii: "/" },
  import: { unicode: "+", ascii: "+" },
  logout: { unicode: "○", ascii: "<" },
  sponsor: { unicode: "♥", ascii: "<3" },
  help: { unicode: "?", ascii: "?" },
  quit: { unicode: "×", ascii: "x" },
};

export const FALLBACK_ICON = { unicode: "·", ascii: "-" };
