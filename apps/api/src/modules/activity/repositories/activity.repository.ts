import {
  type ActivityCallsInput,
  type ActivityCallView,
  type ActivitySummaryView,
  attemptSync,
  type DailyCallsView,
  ok,
  type Page,
  type RankedCountView,
  type RecentUsageView,
  type Result,
} from "@runelay/shared";
import { db } from "@/db/connection";
import { EMPTY_TOTALS, RANKING_LIMIT, RESERVED_SOURCES } from "@/modules/activity/constants/activity.constants";
import type { ActivityTotalsRow, OnboardingRow, ToolCallRecord } from "@/modules/activity/types/activity.types";

export const recordToolCall = ({ organizationId, apiKeyId, source, tool, ok, durationMs }: ToolCallRecord) =>
  attemptSync(
    () =>
      db
        .query(
          "INSERT INTO tool_calls (organization_id, api_key_id, source, tool, ok, duration_ms) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .run(organizationId, apiKeyId, source, tool, ok ? 1 : 0, Math.round(durationMs)),
    "STORAGE_FAILED",
  );

const RESERVED_SQL = Object.values(RESERVED_SOURCES)
  .map((source) => `'${source}'`)
  .join(", ");

const KIND_SQL = `CASE source
  WHEN '${RESERVED_SOURCES.skills}' THEN 'skills'
  WHEN '${RESERVED_SOURCES.memories}' THEN 'memories'
  WHEN '${RESERVED_SOURCES.runelay}' THEN 'search'
  ELSE 'connectors' END`;

const CONNECTORS_ONLY = `AND source NOT IN (${RESERVED_SQL})`;

const rankingSql = (nameExpression: string, filter = "") =>
  `SELECT ${nameExpression} AS name, COUNT(*) AS calls, ROUND(COUNT(*) * 1.0 / SUM(COUNT(*)) OVER (), 4) AS share
   FROM tool_calls
   WHERE organization_id = ?1 AND created_at >= date('now', ?2) ${filter}
   GROUP BY ${nameExpression}
   ORDER BY calls DESC, name
   LIMIT ${RANKING_LIMIT}`;

export const summarizeActivity = (organizationId: string, days: number): Result<ActivitySummaryView> =>
  attemptSync(() => {
    const currentStart = `-${days - 1} days`;
    const previousStart = `-${days * 2 - 1} days`;
    const totals = db
      .query<ActivityTotalsRow, [string, string, string]>(
        `WITH periods AS (
           SELECT
             COALESCE(SUM(created_at >= date('now', ?2)), 0) AS calls,
             COALESCE(SUM(created_at >= date('now', ?2) AND ok = 0), 0) AS errors,
             COALESCE(SUM(created_at < date('now', ?2)), 0) AS previous,
             AVG(CASE WHEN created_at >= date('now', ?2) THEN duration_ms END) AS average
           FROM tool_calls
           WHERE organization_id = ?1 AND created_at >= date('now', ?3)
         )
         SELECT calls, errors,
           CASE WHEN calls = 0 THEN 0 ELSE ROUND(errors * 1.0 / calls, 4) END AS errorRate,
           CASE WHEN previous = 0 THEN NULL ELSE ROUND((calls - previous) * 100.0 / previous, 1) END AS changePercent,
           CASE WHEN average IS NULL THEN NULL ELSE CAST(ROUND(average) AS INTEGER) END AS averageMs
         FROM periods`,
      )
      .get(organizationId, currentStart, previousStart);
    const daily = db
      .query<DailyCallsView, [string, string]>(
        `WITH RECURSIVE calendar(day) AS (
           SELECT date('now', ?2)
           UNION ALL SELECT date(day, '+1 day') FROM calendar WHERE day < date('now')
         ),
         counted AS (
           SELECT date(created_at) AS day, COUNT(*) AS calls,
             SUM(source IN (${RESERVED_SQL})) AS context, SUM(ok = 0) AS errors
           FROM tool_calls
           WHERE organization_id = ?1 AND created_at >= date('now', ?2)
           GROUP BY date(created_at)
         )
         SELECT calendar.day, COALESCE(counted.calls, 0) AS calls,
           COALESCE(counted.context, 0) AS context, COALESCE(counted.errors, 0) AS errors
         FROM calendar LEFT JOIN counted ON counted.day = calendar.day
         ORDER BY calendar.day`,
      )
      .all(organizationId, currentStart);
    const bySource = db
      .query<RankedCountView, [string, string]>(rankingSql("source", CONNECTORS_ONLY))
      .all(organizationId, currentStart);
    const topTools = db
      .query<RankedCountView, [string, string]>(rankingSql("source || '.' || tool", CONNECTORS_ONLY))
      .all(organizationId, currentStart);
    const byKind = db.query<RankedCountView, [string, string]>(rankingSql(KIND_SQL)).all(organizationId, currentStart);
    const recentQuery = db.query<RecentUsageView, [string, string, string]>(
      `SELECT tool AS name, COUNT(*) AS calls, MAX(created_at) AS lastUsedAt
       FROM tool_calls
       WHERE organization_id = ?1 AND created_at >= date('now', ?2) AND source = ?3
       GROUP BY tool
       ORDER BY lastUsedAt DESC, name
       LIMIT ${RANKING_LIMIT}`,
    );
    const recentSkills = recentQuery.all(organizationId, currentStart, RESERVED_SOURCES.skills);
    const recentMemories = recentQuery.all(organizationId, currentStart, RESERVED_SOURCES.memories);
    return { days, ...(totals ?? EMPTY_TOTALS), daily, bySource, topTools, byKind, recentSkills, recentMemories };
  }, "STORAGE_FAILED");

export const findOnboardingProgress = (organizationId: string): Result<OnboardingRow | null> =>
  attemptSync(
    () =>
      db
        .query<OnboardingRow, [string]>(
          `SELECT source, api_key, agent, source + api_key + agent AS completed FROM (SELECT
             EXISTS (SELECT 1 FROM sources WHERE organization_id = ?1) AS source,
             EXISTS (SELECT 1 FROM apikey WHERE referenceId = ?1) AS api_key,
             EXISTS (SELECT 1 FROM tool_calls WHERE organization_id = ?1) AS agent)`,
        )
        .get(organizationId),
    "STORAGE_FAILED",
  );

const CALLS_FILTER = `FROM tool_calls t LEFT JOIN apikey k ON k.id = t.api_key_id
  WHERE t.organization_id = $organizationId
    AND ($keyId IS NULL OR t.api_key_id = $keyId)
    AND ($source IS NULL OR t.source = $source)
    AND ($status IS NULL OR t.ok = $status)
    AND ($query IS NULL OR t.tool LIKE $query ESCAPE '\\' OR t.source LIKE $query ESCAPE '\\')`;

const likePattern = (query: string) => `%${query.replace(/[\\%_]/g, (match) => `\\${match}`)}%`;

export const listActivityCalls = (
  organizationId: string,
  { cursor, limit, keyId, source, status, query }: ActivityCallsInput,
): Result<Page<ActivityCallView>> => {
  const result = attemptSync(() => {
    const params = {
      organizationId,
      keyId: keyId ?? null,
      source: source ?? null,
      status: status === undefined ? null : status === "ok" ? 1 : 0,
      query: query ? likePattern(query) : null,
    };
    const total =
      db.query<{ total: number }, typeof params>(`SELECT COUNT(*) AS total ${CALLS_FILTER}`).get(params)?.total ?? 0;
    const rows = db
      .query<Omit<ActivityCallView, "ok"> & { ok: 0 | 1 }, typeof params & { limit: number; cursor: number }>(
        `SELECT t.id, t.source, t.tool, t.ok, t.duration_ms AS durationMs, t.created_at AS createdAt,
           t.api_key_id AS keyId, k.name AS keyName
         ${CALLS_FILTER} ORDER BY t.created_at DESC, t.id DESC LIMIT $limit OFFSET $cursor`,
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
