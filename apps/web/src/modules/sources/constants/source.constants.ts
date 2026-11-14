import { ApiIcon, ComputerTerminal01Icon } from "@hugeicons/core-free-icons";
import type { SourceKind, SourceStatus } from "@runeley/shared";

export const STATUS_LABEL: Record<SourceStatus, string> = {
  ok: "Conectado",
  error: "Com erro",
  needs_auth: "Precisa de login",
  idle: "Não testado",
};

export const STATUS_DOT: Record<SourceStatus, string> = {
  ok: "bg-success",
  error: "bg-destructive",
  needs_auth: "bg-warning",
  idle: "bg-muted-foreground/40",
};

export const KIND_LABEL: Record<SourceKind, string> = {
  mcp: "MCP remoto",
  stdio: "Comando local",
  openapi: "OpenAPI",
};

export const KIND_ICON = {
  stdio: ComputerTerminal01Icon,
  openapi: ApiIcon,
} satisfies Record<Exclude<SourceKind, "mcp">, unknown>;

export const KIND_HINT: Record<SourceKind, string> = {
  mcp: "URL de um servidor MCP. Se pedir login, o OAuth abre em seguida.",
  stdio: "Comando que sobe um MCP na própria máquina do runeley.",
  openapi: "Spec OpenAPI em JSON ou YAML. Cada operação vira uma tool.",
};
