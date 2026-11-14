import type { SQLQueryBindings } from "bun:sqlite";
import {
  attemptSync,
  type CreateMemoryInput,
  fail,
  type ListMemoriesInput,
  type MemoryHealthView,
  type MemoryListItemView,
  type MemoryRefView,
  type MemoryVersionView,
  type MemoryView,
  ok,
  type Page,
  type Result,
  type UpdateMemoryInput,
} from "@runeley/shared";
import { db } from "@/db/connection";
import { MEMORY_LIST_COLUMNS, MEMORY_REF_COLUMNS } from "@/modules/memories/constants/memory.constants";
import type { MemoryContent, MemoryDetailRow, MemoryListRow } from "@/modules/memories/types/memory.types";
import { parseLinks } from "@/modules/memories/utils/parse-links";
import { SQL_NOW } from "@/shared/constants/sql.constants";
import { toFtsQuery } from "@/shared/utils/fts-query";
import { pageOf } from "@/shared/utils/page";

const syncDerived = (organizationId: string, { slug, name, description, body }: MemoryContent) => {
  db.query("DELETE FROM memory_links WHERE organization_id = ? AND from_slug = ?").run(organizationId, slug);
  const insertLink = db.query(
    "INSERT OR IGNORE INTO memory_links (organization_id, from_slug, to_slug) VALUES (?, ?, ?)",
  );
  for (const target of parseLinks(body, slug)) insertLink.run(organizationId, slug, target);
  db.query("DELETE FROM memories_fts WHERE organization_id = ? AND slug = ?").run(organizationId, slug);
  db.query("INSERT INTO memories_fts (slug, name, description, body, organization_id) VALUES (?, ?, ?, ?, ?)").run(
    slug,
    name,
    description,
    body,
    organizationId,
  );
};

const snapshotVersion = (organizationId: string, slug: string) =>
  db
    .query(
      `INSERT INTO memory_versions (organization_id, slug, name, description, body)
       SELECT organization_id, slug, name, description, body FROM memories WHERE organization_id = ? AND slug = ?`,
    )
    .run(organizationId, slug);

export const listMemories = (
  organizationId: string,
  { query, type, pinned, cursor, limit }: ListMemoriesInput,
): Result<Page<MemoryListItemView>> => {
  const match = query ? toFtsQuery(query, "AND") : null;
  const where = ["m.organization_id = ?"];
  const params: SQLQueryBindings[] = [organizationId];
  if (type) {
    where.push("m.type = ?");
    params.push(type);
  }
  if (pinned) {
    where.push("m.pinned = ?");
    params.push(pinned === "true" ? 1 : 0);
  }
  if (match) {
    where.push("memories_fts MATCH ?");
    params.push(match);
  }
  const from = match
    ? "memories m JOIN memories_fts ON memories_fts.organization_id = m.organization_id AND memories_fts.slug = m.slug"
    : "memories m";
  const order = match ? "bm25(memories_fts, 4, 6, 3, 1)" : "m.pinned DESC, m.updated_at DESC";
  return attemptSync(() => {
    const total =
      db
        .query<{ total: number }, SQLQueryBindings[]>(
          `SELECT COUNT(*) AS total FROM ${from} WHERE ${where.join(" AND ")}`,
        )
        .get(...params)?.total ?? 0;
    const rows = db
      .query<MemoryListRow, SQLQueryBindings[]>(
        `SELECT ${MEMORY_LIST_COLUMNS} FROM ${from} WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT ? OFFSET ?`,
      )
      .all(...params, limit, cursor);
    return pageOf(
      rows.map((row) => ({ ...row, pinned: row.pinned === 1 })),
      total,
      cursor,
    );
  }, "STORAGE_FAILED");
};

export const findMemory = (organizationId: string, slug: string): Result<MemoryView> => {
  const row = attemptSync(
    () =>
      db
        .query<MemoryDetailRow, [string, string]>(
          `SELECT ${MEMORY_LIST_COLUMNS}, m.body, m.created_at AS createdAt,
             (SELECT json_group_array(to_slug) FROM (
               SELECT to_slug FROM memory_links WHERE organization_id = m.organization_id AND from_slug = m.slug
               ORDER BY to_slug)) AS links,
             (SELECT json_group_array(from_slug) FROM (
               SELECT from_slug FROM memory_links WHERE organization_id = m.organization_id AND to_slug = m.slug
               ORDER BY from_slug)) AS backlinks,
             (SELECT json_group_array(to_slug) FROM (
               SELECT l.to_slug FROM memory_links l
               WHERE l.organization_id = m.organization_id AND l.from_slug = m.slug
                 AND NOT EXISTS (SELECT 1 FROM memories t WHERE t.organization_id = l.organization_id AND t.slug = l.to_slug)
               ORDER BY l.to_slug)) AS brokenLinks
           FROM memories m WHERE m.organization_id = ? AND m.slug = ?`,
        )
        .get(organizationId, slug),
    "STORAGE_FAILED",
  );
  if (row.error) return row;
  if (!row.data) return fail("MEMORY_NOT_FOUND", `Memória "${slug}" não encontrada.`);
  const { links, backlinks, brokenLinks, pinned, ...rest } = row.data;
  return attemptSync(
    () => ({
      ...rest,
      pinned: pinned === 1,
      links: JSON.parse(links) as string[],
      backlinks: JSON.parse(backlinks) as string[],
      brokenLinks: JSON.parse(brokenLinks) as string[],
    }),
    "STORAGE_FAILED",
  );
};

export const memoryExists = (organizationId: string, slug: string): Result<boolean> => {
  const row = attemptSync(
    () => db.query("SELECT 1 FROM memories WHERE organization_id = ? AND slug = ?").get(organizationId, slug),
    "STORAGE_FAILED",
  );
  return row.error ? row : ok(row.data !== null);
};

export const insertMemory = (organizationId: string, input: CreateMemoryInput): Result<null> => {
  const written = attemptSync(
    db.transaction(() => {
      const inserted = db
        .query(
          `INSERT INTO memories (organization_id, slug, name, description, type, body, pinned) VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(organization_id, slug) DO NOTHING`,
        )
        .run(organizationId, input.slug, input.name, input.description, input.type, input.body, input.pinned ? 1 : 0);
      if (!inserted.changes) return false;
      syncDerived(organizationId, input);
      return true;
    }),
    "STORAGE_FAILED",
  );
  if (written.error) return written;
  return written.data ? ok(null) : fail("ALREADY_EXISTS", `Já existe uma memória "${input.slug}".`);
};

export const updateMemoryRow = (organizationId: string, slug: string, input: UpdateMemoryInput): Result<null> => {
  const written = attemptSync(
    db.transaction(() => {
      snapshotVersion(organizationId, slug);
      const updated = db
        .query<MemoryContent, SQLQueryBindings[]>(
          `UPDATE memories SET
             name = COALESCE(?, name), description = COALESCE(?, description), type = COALESCE(?, type),
             body = COALESCE(?, body), pinned = COALESCE(?, pinned), updated_at = ${SQL_NOW}
           WHERE organization_id = ? AND slug = ?
           RETURNING slug, name, description, body`,
        )
        .get(
          input.name ?? null,
          input.description ?? null,
          input.type ?? null,
          input.body ?? null,
          input.pinned === undefined ? null : input.pinned ? 1 : 0,
          organizationId,
          slug,
        );
      if (updated) syncDerived(organizationId, updated);
      return updated !== null;
    }),
    "STORAGE_FAILED",
  );
  if (written.error) return written;
  return written.data ? ok(null) : fail("MEMORY_NOT_FOUND", `Memória "${slug}" não encontrada.`);
};

export const deleteMemoryRow = (organizationId: string, slug: string): Result<null> => {
  const deleted = attemptSync(
    db.transaction(() => {
      const removed = db.query("DELETE FROM memories WHERE organization_id = ? AND slug = ?").run(organizationId, slug);
      db.query("DELETE FROM memory_links WHERE organization_id = ? AND from_slug = ?").run(organizationId, slug);
      db.query("DELETE FROM memory_versions WHERE organization_id = ? AND slug = ?").run(organizationId, slug);
      db.query("DELETE FROM memories_fts WHERE organization_id = ? AND slug = ?").run(organizationId, slug);
      return removed.changes;
    }),
    "STORAGE_FAILED",
  );
  if (deleted.error) return deleted;
  return deleted.data ? ok(null) : fail("MEMORY_NOT_FOUND", `Memória "${slug}" não encontrada.`);
};

export const listVersions = (organizationId: string, slug: string): Result<MemoryVersionView[]> =>
  attemptSync(
    () =>
      db
        .query<MemoryVersionView, [string, string]>(
          `SELECT id, name, description, body, created_at AS createdAt FROM memory_versions
           WHERE organization_id = ? AND slug = ? ORDER BY id DESC`,
        )
        .all(organizationId, slug),
    "STORAGE_FAILED",
  );

export const describeHealth = (organizationId: string, staleDays: number): Result<MemoryHealthView> =>
  attemptSync(() => {
    const stale = db
      .query<MemoryRefView, [string, string]>(
        `SELECT ${MEMORY_REF_COLUMNS} FROM memories m
         WHERE m.organization_id = ? AND m.updated_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?)
         ORDER BY m.updated_at`,
      )
      .all(organizationId, `-${staleDays} days`);
    const brokenLinks = db
      .query<{ from: string; to: string }, [string]>(
        `SELECT l.from_slug AS "from", l.to_slug AS "to" FROM memory_links l
         WHERE l.organization_id = ?
           AND NOT EXISTS (SELECT 1 FROM memories t WHERE t.organization_id = l.organization_id AND t.slug = l.to_slug)
         ORDER BY l.from_slug, l.to_slug`,
      )
      .all(organizationId);
    const isolated = db
      .query<MemoryRefView, [string]>(
        `SELECT ${MEMORY_REF_COLUMNS} FROM memories m
         WHERE m.organization_id = ?
           AND NOT EXISTS (SELECT 1 FROM memory_links l WHERE l.organization_id = m.organization_id AND l.from_slug = m.slug)
           AND NOT EXISTS (SELECT 1 FROM memory_links l WHERE l.organization_id = m.organization_id AND l.to_slug = m.slug)
         ORDER BY m.name`,
      )
      .all(organizationId);
    const total =
      db
        .query<{ total: number }, [string]>("SELECT COUNT(*) AS total FROM memories WHERE organization_id = ?")
        .get(organizationId)?.total ?? 0;
    return { staleDays, stale, brokenLinks, isolated, total };
  }, "STORAGE_FAILED");

export const upsertMemories = (organizationId: string, memories: CreateMemoryInput[]): Result<number> =>
  attemptSync(
    db.transaction(() => {
      const version = db.query(
        `INSERT INTO memory_versions (organization_id, slug, name, description, body)
         SELECT organization_id, slug, name, description, body FROM memories
         WHERE organization_id = ? AND slug = ? AND (name <> ? OR description <> ? OR body <> ?)`,
      );
      const upsert = db.query(
        `INSERT INTO memories (organization_id, slug, name, description, type, body, pinned) VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(organization_id, slug) DO UPDATE SET
           name = excluded.name, description = excluded.description, type = excluded.type, body = excluded.body,
           pinned = excluded.pinned, updated_at = ${SQL_NOW}
         WHERE memories.name <> excluded.name OR memories.description <> excluded.description
           OR memories.type <> excluded.type OR memories.body <> excluded.body OR memories.pinned <> excluded.pinned`,
      );
      for (const memory of memories) {
        version.run(organizationId, memory.slug, memory.name, memory.description, memory.body);
        upsert.run(
          organizationId,
          memory.slug,
          memory.name,
          memory.description,
          memory.type,
          memory.body,
          memory.pinned ? 1 : 0,
        );
        syncDerived(organizationId, memory);
      }
      return memories.length;
    }),
    "STORAGE_FAILED",
  );
