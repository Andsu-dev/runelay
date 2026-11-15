import { ApiIcon, ComputerTerminal01Icon } from "@hugeicons/core-free-icons";
import type { SourceKind, SourceStatus } from "@runelay/shared";
import type { MessageKey } from "@/lib/i18n";

export const STATUS_LABEL: Record<SourceStatus, MessageKey> = {
  ok: "sources.status.ok",
  error: "sources.status.error",
  needs_auth: "sources.status.needs_auth",
  idle: "sources.status.idle",
};

export const STATUS_DOT: Record<SourceStatus, string> = {
  ok: "bg-success",
  error: "bg-destructive",
  needs_auth: "bg-warning",
  idle: "bg-muted-foreground/40",
};

export const KIND_LABEL: Record<SourceKind, MessageKey> = {
  mcp: "sources.kind.mcp",
  stdio: "sources.kind.stdio",
  openapi: "sources.kind.openapi",
};

export const KIND_ICON = {
  stdio: ComputerTerminal01Icon,
  openapi: ApiIcon,
} satisfies Record<Exclude<SourceKind, "mcp">, unknown>;

export const KIND_HINT: Record<SourceKind, MessageKey> = {
  mcp: "sources.kindHint.mcp",
  stdio: "sources.kindHint.stdio",
  openapi: "sources.kindHint.openapi",
};

export const OAUTH_CALLBACK_PATH = "/v1/oauth/callback";
