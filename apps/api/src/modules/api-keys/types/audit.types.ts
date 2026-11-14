import type { AuditEventView } from "@runeley/shared";

export interface AuditRecord {
  organizationId: string;
  apiKeyId: string | null;
  method: string;
  path: string;
  status: number;
  ip: string | null;
}

export interface AuditEventRow extends Omit<AuditEventView, "ok"> {
  ok: 0 | 1;
}
