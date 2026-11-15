import { ApiIcon, ComputerTerminal01Icon } from "@hugeicons/core-free-icons";
import type { GoogleService, SourceKind, SourceStatus } from "@runelay/shared";
import type { MessageKey } from "@/lib/i18n";
import type { DraftKind } from "@/modules/sources/schemas/source-draft.schema";

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
  google: "sources.kind.google",
};

export const KIND_ICON = {
  stdio: ComputerTerminal01Icon,
  openapi: ApiIcon,
} satisfies Record<Exclude<DraftKind, "mcp">, unknown>;

export const KIND_HINT: Record<DraftKind, MessageKey> = {
  mcp: "sources.kindHint.mcp",
  stdio: "sources.kindHint.stdio",
  openapi: "sources.kindHint.openapi",
};

export const GOOGLE_SERVICE_LABEL: Record<GoogleService, MessageKey> = {
  calendar: "sources.google.services.calendar",
  docs: "sources.google.services.docs",
  sheets: "sources.google.services.sheets",
  slides: "sources.google.services.slides",
  drive: "sources.google.services.drive",
  gmail: "sources.google.services.gmail",
  forms: "sources.google.services.forms",
  meet: "sources.google.services.meet",
};

export const OAUTH_CALLBACK_PATH = "/v1/oauth/callback";
