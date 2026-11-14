import { type AuditEventView, attemptSync, ok, type Page, type Result } from "@runelay/shared";
import { db } from "@/db/connection";
import type { AuditEventRow, AuditRecord } from "@/modules/api-keys/types/audit.types";

const TIMELINE = `SELECT 'tool-' || id AS id, 'tool' AS kind, source || '.' || tool AS action, ok, duration_ms AS durationMs,
    NULL AS ip, created_at AS createdAt
  FROM tool_calls WHERE organization_id = $organizationId AND api_key_id = $keyId
  UNION ALL
  SELECT 'http-' || id, 'http', method || ' ' || path, CASE WHEN status < 400 THEN 1 ELSE 0 END, NULL, ip, created_at
  FROM audit_events WHERE organization_id = $organizationId AND api_key_id = $keyId`;

export const recordAuditEvent = ({ organizationId, apiKeyId, method, path, status, ip }: AuditRecord) =>
  attemptSync(
    () =>
      db
        .query(
          "INSERT INTO audit_events (organization_id, api_key_id, method, path, status, ip) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .run(organizationId, apiKeyId, method, path, status, ip),
    "STORAGE_FAILED",
  );

export const listKeyActivity = (
  organizationId: string,
  keyId: string,
  cursor: number,
  limit: number,
): Result<Page<AuditEventView>> => {
  const result = attemptSync(() => {
    const params = { organizationId, keyId };
    const total =
      db.query<{ total: number }, typeof params>(`SELECT COUNT(*) AS total FROM (${TIMELINE})`).get(params)?.total ?? 0;
    const rows = db
      .query<AuditEventRow, typeof params & { limit: number; cursor: number }>(
        `${TIMELINE} ORDER BY createdAt DESC LIMIT $limit OFFSET $cursor`,
      )
      .all({ ...params, limit, cursor });
    return { total, rows };
  }, "STORAGE_FAILED");
  if (result.error) return result;
  const { total, rows } = result.data;
  const next = cursor + rows.length;
  return ok({
    items: rows.map((row) => ({ ...row, ok: row.ok === 1 })),
    total,
    nextCursor: next < total ? next : null,
  });
};
