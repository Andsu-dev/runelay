export const RECONNECT_POLL_MS = 2500;

export type ReconnectRowState = "connected" | "waiting" | "next" | "skipped" | "queued";

export const RECONNECT_ROW_LABEL: Record<ReconnectRowState, string> = {
  connected: "Conectada",
  waiting: "Aguardando o login na outra aba",
  next: "Próxima",
  skipped: "Pulada",
  queued: "Na fila",
};
