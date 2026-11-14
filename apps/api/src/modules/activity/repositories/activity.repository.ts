import {
  type ActivitySummaryView,
  attemptSync,
  type DailyCallsView,
  type RankedCountView,
  type Result,
} from "@runeley/shared";
import { db } from "@/db/connection";
import { EMPTY_TOTALS, RANKING_LIMIT } from "@/modules/activity/constants/activity.constants";
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

const rankingSql = (nameExpression: string) =>
  `SELECT ${nameExpression} AS name, COUNT(*) AS calls, ROUND(COUNT(*) * 1.0 / SUM(COUNT(*)) OVER (), 4) AS share
   FROM tool_calls
   WHERE organization_id = ?1 AND created_at >= date('now', ?2)
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
           SELECT date(created_at) AS day, COUNT(*) AS calls, SUM(ok = 0) AS errors
           FROM tool_calls
           WHERE organization_id = ?1 AND created_at >= date('now', ?2)
           GROUP BY date(created_at)
         )
         SELECT calendar.day, COALESCE(counted.calls, 0) AS calls, COALESCE(counted.errors, 0) AS errors
         FROM calendar LEFT JOIN counted ON counted.day = calendar.day
         ORDER BY calendar.day`,
      )
      .all(organizationId, currentStart);
    const bySource = db
      .query<RankedCountView, [string, string]>(rankingSql("source"))
      .all(organizationId, currentStart);
    const topTools = db
      .query<RankedCountView, [string, string]>(rankingSql("source || '.' || tool"))
      .all(organizationId, currentStart);
    return { days, ...(totals ?? EMPTY_TOTALS), daily, bySource, topTools };
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
