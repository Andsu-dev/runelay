import {
  attemptSync,
  type OrganizationRole,
  type OrganizationView,
  ok,
  type Result,
  type UpdateOrganizationInput,
} from "@runelay/shared";
import { db } from "@/db/connection";
import { ORGANIZATION_DATA_TABLES, PERSONAL_ORGANIZATION_NAME } from "@/modules/auth/constants/auth.constants";
import { slugify } from "@/modules/auth/utils/slugify";
import { SQL_NOW } from "@/shared/constants/sql.constants";

export const listMemberships = (userId: string): Result<OrganizationView[]> =>
  attemptSync(
    () =>
      db
        .query<OrganizationView, [string]>(
          `SELECT o.id, o.name, o.slug, o.logo, m.role
           FROM member m JOIN organization o ON o.id = m.organizationId
           WHERE m.userId = ? ORDER BY m.createdAt, o.name`,
        )
        .all(userId),
    "STORAGE_FAILED",
  );

export const findMembershipRole = (userId: string, organizationId: string): Result<OrganizationRole | null> => {
  const row = attemptSync(
    () =>
      db
        .query<{ role: OrganizationRole }, [string, string]>(
          "SELECT role FROM member WHERE userId = ? AND organizationId = ?",
        )
        .get(userId, organizationId),
    "STORAGE_FAILED",
  );
  return row.error ? row : ok(row.data?.role ?? null);
};

export const slugTaken = (slug: string): Result<boolean> => {
  const row = attemptSync(
    () => db.query<{ id: string }, [string]>("SELECT id FROM organization WHERE slug = ?").get(slug),
    "STORAGE_FAILED",
  );
  return row.error ? row : ok(row.data !== null);
};

export const ensurePersonalOrganization = (userId: string): Result<string | null> =>
  attemptSync(
    db.transaction(() => {
      const existing = db
        .query<{ organizationId: string }, [string]>(
          "SELECT organizationId FROM member WHERE userId = ? ORDER BY createdAt LIMIT 1",
        )
        .get(userId);
      if (existing) return existing.organizationId;
      const user = db.query<{ name: string }, [string]>(`SELECT name FROM "user" WHERE id = ?`).get(userId);
      if (!user) return null;
      const base = slugify(user.name);
      const free = !db.query("SELECT 1 FROM organization WHERE slug = ?").get(base);
      const slug = free ? base : `${base}-${crypto.randomUUID().slice(0, 6)}`;
      const organizationId = crypto.randomUUID();
      db.query(`INSERT INTO organization (id, name, slug, createdAt) VALUES (?, ?, ?, ${SQL_NOW})`).run(
        organizationId,
        PERSONAL_ORGANIZATION_NAME,
        slug,
      );
      db.query(
        `INSERT INTO member (id, organizationId, userId, role, createdAt) VALUES (?, ?, ?, 'owner', ${SQL_NOW})`,
      ).run(crypto.randomUUID(), organizationId, userId);
      return organizationId;
    }),
    "STORAGE_FAILED",
  );

export const findMembership = (userId: string, organizationId: string): Result<OrganizationView | null> => {
  const row = attemptSync(
    () =>
      db
        .query<OrganizationView, [string, string]>(
          `SELECT o.id, o.name, o.slug, o.logo, m.role
           FROM member m JOIN organization o ON o.id = m.organizationId
           WHERE m.userId = ? AND m.organizationId = ?`,
        )
        .get(userId, organizationId),
    "STORAGE_FAILED",
  );
  return row.error ? row : ok(row.data);
};

export const updateOrganizationRow = (organizationId: string, patch: UpdateOrganizationInput): Result<null> =>
  attemptSync(() => {
    if (patch.name !== undefined)
      db.query("UPDATE organization SET name = ? WHERE id = ?").run(patch.name, organizationId);
    if (patch.logo !== undefined)
      db.query("UPDATE organization SET logo = ? WHERE id = ?").run(patch.logo, organizationId);
    return null;
  }, "STORAGE_FAILED");

export const hasStrandedMember = (organizationId: string): Result<boolean> => {
  const row = attemptSync(
    () =>
      db
        .query<{ userId: string }, [string]>(
          `SELECT m.userId FROM member m
           WHERE m.organizationId = ?1
             AND NOT EXISTS (SELECT 1 FROM member o WHERE o.userId = m.userId AND o.organizationId != ?1)
           LIMIT 1`,
        )
        .get(organizationId),
    "STORAGE_FAILED",
  );
  return row.error ? row : ok(row.data !== null);
};

export const deleteOrganizationRows = (organizationId: string): Result<null> =>
  attemptSync(
    db.transaction(() => {
      for (const table of ORGANIZATION_DATA_TABLES)
        db.query(`DELETE FROM ${table} WHERE organization_id = ?`).run(organizationId);
      db.query("DELETE FROM apikey WHERE referenceId = ?").run(organizationId);
      db.query(
        `UPDATE session SET activeOrganizationId = (
           SELECT m.organizationId FROM member m
           WHERE m.userId = session.userId AND m.organizationId != ?1
           ORDER BY m.createdAt LIMIT 1
         ) WHERE activeOrganizationId = ?1`,
      ).run(organizationId);
      db.query("DELETE FROM invitation WHERE organizationId = ?").run(organizationId);
      db.query("DELETE FROM member WHERE organizationId = ?").run(organizationId);
      db.query("DELETE FROM organization WHERE id = ?").run(organizationId);
      return null;
    }),
    "STORAGE_FAILED",
  );
