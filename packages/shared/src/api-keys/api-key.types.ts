import type { z } from "zod";
import type { createApiKeySchema } from "./api-key.schema";

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;

export interface ApiKeyView {
  id: string;
  name: string | null;
  start: string | null;
  createdAt: string;
  lastRequest: string | null;
  recoverable: boolean;
}

export interface AuditEventView {
  id: string;
  kind: "tool" | "http";
  action: string;
  ok: boolean;
  durationMs: number | null;
  ip: string | null;
  createdAt: string;
}

export interface ApiKeySecretView {
  key: string;
}

export interface CreatedApiKeyView extends ApiKeyView {
  key: string;
}
