import type { MessageKey } from "@/lib/i18n";

export const RECONNECT_POLL_MS = 2500;

export type ReconnectRowState = "connected" | "waiting" | "next" | "skipped" | "queued";

export const RECONNECT_ROW_LABEL: Record<ReconnectRowState, MessageKey> = {
  connected: "reconnect.row.connected",
  waiting: "reconnect.row.waiting",
  next: "reconnect.row.next",
  skipped: "reconnect.row.skipped",
  queued: "reconnect.row.queued",
};
