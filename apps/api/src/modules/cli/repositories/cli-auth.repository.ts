import { attemptSync, type CliAuthStatus, type CliStatusView, fail, ok, type Result } from "@runelay/shared";
import { db } from "@/db/connection";
import type { ConsumedCliAuthRow, NewCliAuthRequest, PendingCliAuthRow } from "@/modules/cli/types/cli-auth.types";
import { SQL_NOW } from "@/shared/constants/sql.constants";

export const insertCliAuthRequest = ({ code, pollTokenHash, device, expiresAt }: NewCliAuthRequest): Result<boolean> =>
  attemptSync(
    () =>
      db.transaction(() => {
        db.query(`DELETE FROM cli_auth_requests WHERE expires_at < ${SQL_NOW}`).run();
        return (
          db
            .query(
              "INSERT OR IGNORE INTO cli_auth_requests (code, poll_token_hash, device, expires_at) VALUES (?, ?, ?, ?)",
            )
            .run(code, pollTokenHash, device, expiresAt).changes > 0
        );
      })(),
    "STORAGE_FAILED",
  );

export const findPendingCliAuth = (code: string): Result<PendingCliAuthRow> => {
  const row = attemptSync(
    () =>
      db
        .query<PendingCliAuthRow, [string]>(
          `SELECT code, device, expires_at AS expiresAt FROM cli_auth_requests
           WHERE code = ? AND status = 'pending' AND expires_at > ${SQL_NOW}`,
        )
        .get(code),
    "STORAGE_FAILED",
  );
  if (row.error) return row;
  return row.data ? ok(row.data) : fail("CLI_AUTH_NOT_FOUND");
};

export const markCliAuthApproved = (code: string, organizationId: string, sealedKey: string): Result<boolean> =>
  attemptSync(
    () =>
      db
        .query(
          `UPDATE cli_auth_requests SET status = 'approved', organization_id = ?, api_key = ?
           WHERE code = ? AND status = 'pending' AND expires_at > ${SQL_NOW}`,
        )
        .run(organizationId, sealedKey, code).changes > 0,
    "STORAGE_FAILED",
  );

export const findCliAuthStatus = (pollTokenHash: string): Result<CliAuthStatus> => {
  const row = attemptSync(
    () =>
      db
        .query<{ status: CliAuthStatus }, [string]>(
          `SELECT CASE WHEN status = 'pending' AND expires_at > ${SQL_NOW} THEN 'pending'
             WHEN status = 'approved' THEN 'approved' ELSE 'expired' END AS status
           FROM cli_auth_requests WHERE poll_token_hash = ?`,
        )
        .get(pollTokenHash),
    "STORAGE_FAILED",
  );
  if (row.error) return row;
  return ok(row.data?.status ?? "expired");
};

export const consumeApprovedCliAuth = (pollTokenHash: string): Result<ConsumedCliAuthRow | null> =>
  attemptSync(
    () =>
      db
        .transaction(() => {
          const row = db
            .query<ConsumedCliAuthRow, [string]>(
              `SELECT r.api_key AS sealedKey, o.name AS organizationName
             FROM cli_auth_requests r JOIN organization o ON o.id = r.organization_id
             WHERE r.poll_token_hash = ? AND r.status = 'approved' AND r.api_key IS NOT NULL`,
            )
            .get(pollTokenHash);
          if (!row) return null;
          db.query(
            "UPDATE cli_auth_requests SET status = 'consumed', api_key = NULL WHERE poll_token_hash = ? AND status = 'approved'",
          ).run(pollTokenHash);
          return row;
        })
        .immediate(),
    "STORAGE_FAILED",
  );

export const findCliStatus = (organizationId: string): Result<CliStatusView> => {
  const row = attemptSync(
    () =>
      db
        .query<CliStatusView, [string, string, string, string]>(
          `SELECT o.name AS organizationName,
             (SELECT COUNT(*) FROM sources WHERE organization_id = ?) AS sources,
             (SELECT COUNT(*) FROM memories WHERE organization_id = ?) AS memories,
             (SELECT COUNT(*) FROM skills WHERE organization_id = ?) AS skills
           FROM organization o WHERE o.id = ?`,
        )
        .get(organizationId, organizationId, organizationId, organizationId),
    "STORAGE_FAILED",
  );
  if (row.error) return row;
  return row.data ? ok(row.data) : fail("FORBIDDEN");
};
