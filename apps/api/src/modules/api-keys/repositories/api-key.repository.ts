import { type ApiKeySecretView, type ApiKeyView, attemptSync, fail, ok, type Result } from "@runelay/shared";
import { db } from "@/db/connection";
import { seal, unseal } from "@/shared/crypto";

const VIEW_SELECT = `SELECT k.id, k.name, k.start, k.createdAt, k.lastRequest,
    CASE WHEN s.key_id IS NULL THEN 0 ELSE 1 END AS recoverable
  FROM apikey k LEFT JOIN api_key_secrets s ON s.key_id = k.id`;

type ApiKeyRow = Omit<ApiKeyView, "recoverable"> & { recoverable: 0 | 1 };

export const listApiKeyViews = (organizationId: string): Result<ApiKeyView[]> => {
  const rows = attemptSync(
    () =>
      db
        .query<ApiKeyRow, [string]>(`${VIEW_SELECT} WHERE k.referenceId = ? ORDER BY k.createdAt DESC`)
        .all(organizationId),
    "STORAGE_FAILED",
  );
  if (rows.error) return rows;
  return ok(rows.data.map((row) => ({ ...row, recoverable: row.recoverable === 1 })));
};

export const findApiKeyView = (organizationId: string, id: string): Result<ApiKeyView> => {
  const row = attemptSync(
    () =>
      db
        .query<ApiKeyRow, [string, string]>(`${VIEW_SELECT} WHERE k.referenceId = ? AND k.id = ?`)
        .get(organizationId, id),
    "STORAGE_FAILED",
  );
  if (row.error) return row;
  return row.data ? ok({ ...row.data, recoverable: row.data.recoverable === 1 }) : fail("API_KEY_NOT_FOUND");
};

export const saveApiKeySecret = (organizationId: string, keyId: string, key: string): Result<null> => {
  const saved = attemptSync(
    () =>
      db
        .query("INSERT OR REPLACE INTO api_key_secrets (key_id, organization_id, sealed) VALUES (?, ?, ?)")
        .run(keyId, organizationId, seal(key)),
    "STORAGE_FAILED",
  );
  return saved.error ? saved : ok(null);
};

export const findApiKeySecret = (organizationId: string, keyId: string): Result<ApiKeySecretView> => {
  const row = attemptSync(
    () =>
      db
        .query<{ sealed: string }, [string, string]>(
          "SELECT sealed FROM api_key_secrets WHERE organization_id = ? AND key_id = ?",
        )
        .get(organizationId, keyId),
    "STORAGE_FAILED",
  );
  if (row.error) return row;
  if (!row.data) return fail("API_KEY_NOT_FOUND", "Essa chave foi criada antes do cofre e não pode ser recuperada.");
  const key = unseal<string>(row.data.sealed);
  return key.error ? key : ok({ key: key.data });
};

export const deleteApiKeyRow = (organizationId: string, id: string): Result<null> => {
  const deleted = attemptSync(
    () =>
      db.transaction(() => {
        db.query("DELETE FROM api_key_secrets WHERE organization_id = ? AND key_id = ?").run(organizationId, id);
        return db.query("DELETE FROM apikey WHERE referenceId = ? AND id = ?").run(organizationId, id);
      })(),
    "STORAGE_FAILED",
  );
  if (deleted.error) return deleted;
  return deleted.data.changes ? ok(null) : fail("API_KEY_NOT_FOUND");
};
