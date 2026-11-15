import { beforeAll, describe, expect, test } from "bun:test";
import type { ActivitySummaryView, OnboardingView } from "@runelay/shared";
import { db } from "@/db/connection";
import { recordToolCall, summarizeActivity } from "@/modules/activity/repositories/activity.repository";
import { describeOnboarding } from "@/modules/activity/services/activity.service";
import { withQueryFault } from "../../../../test/db-fault-helpers";
import { body, call, createApiKey, resetDatabase, signUp, type TestAccount } from "../../../../test/helpers";

let account: TestAccount;
let empty: TestAccount;

const isoDaysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

const seedCall = (
  organizationId: string,
  source: string,
  tool: string,
  ok: boolean,
  durationMs: number,
  daysAgo: number,
) => {
  const inserted = recordToolCall({ organizationId, apiKeyId: null, source, tool, ok, durationMs });
  if (inserted.error) throw new Error(inserted.error.message);
  db.query("UPDATE tool_calls SET created_at = ? WHERE id = ?").run(isoDaysAgo(daysAgo), inserted.data.lastInsertRowid);
};

beforeAll(async () => {
  resetDatabase();
  account = await signUp("Activity Owner");
  empty = await signUp("Activity Empty");
  seedCall(account.organizationId, "github", "list_issues", true, 100.4, 0);
  seedCall(account.organizationId, "github", "list_issues", false, 200, 0);
  seedCall(account.organizationId, "github", "create_issue", true, 300, 1);
  seedCall(account.organizationId, "linear", "search", true, 400, 2);
  seedCall(account.organizationId, "linear", "search", true, 50, 10);
  seedCall(account.organizationId, "linear", "search", true, 50, 11);
  seedCall(account.organizationId, "old", "ignored", true, 50, 30);
  seedCall("other-org", "github", "x", true, 1, 0);
});

describe("activity summary", () => {
  test("aggregates totals, change, daily series and rankings for the range", async () => {
    const response = await call("/v1/activity/summary?days=7", { cookie: account.cookie });
    const { data } = await body<ActivitySummaryView>(response);
    expect(response.status).toBe(200);
    expect(data.days).toBe(7);
    expect(data.calls).toBe(4);
    expect(data.errors).toBe(1);
    expect(data.errorRate).toBe(0.25);
    expect(data.changePercent).toBe(100);
    expect(data.averageMs).toBe(250);
    expect(data.daily).toHaveLength(7);
    expect(data.daily.reduce((sum, day) => sum + day.calls, 0)).toBe(4);
    expect(data.daily.reduce((sum, day) => sum + day.errors, 0)).toBe(1);
    expect(data.bySource).toEqual([
      { name: "github", calls: 3, share: 0.75 },
      { name: "linear", calls: 1, share: 0.25 },
    ]);
    expect(data.topTools[0]).toEqual({ name: "github.list_issues", calls: 2, share: 0.5 });
    expect(data.topTools).toHaveLength(3);
    expect(data.byKind).toEqual([{ name: "connectors", calls: 4, share: 1 }]);
    expect(data.recentSkills).toEqual([]);
    expect(data.recentMemories).toEqual([]);
  });

  test("splits built-in context calls from connector rankings", async () => {
    const mixed = await signUp("Activity Mixed");
    seedCall(mixed.organizationId, "github", "list_issues", true, 10, 0);
    seedCall(mixed.organizationId, "skills", "deploy", true, 10, 1);
    seedCall(mixed.organizationId, "skills", "review", true, 10, 0);
    seedCall(mixed.organizationId, "skills", "review", true, 10, 0);
    seedCall(mixed.organizationId, "memories", "notes", true, 10, 0);
    const { data } = await body<ActivitySummaryView>(
      await call("/v1/activity/summary?days=7", { cookie: mixed.cookie }),
    );
    expect(data.calls).toBe(5);
    expect(data.daily.reduce((sum, day) => sum + day.context, 0)).toBe(4);
    expect(data.bySource).toEqual([{ name: "github", calls: 1, share: 1 }]);
    expect(data.topTools).toEqual([{ name: "github.list_issues", calls: 1, share: 1 }]);
    expect(data.byKind).toEqual([
      { name: "skills", calls: 3, share: 0.6 },
      { name: "connectors", calls: 1, share: 0.2 },
      { name: "memories", calls: 1, share: 0.2 },
    ]);
    expect(data.recentSkills.map((skill) => [skill.name, skill.calls])).toEqual([
      ["review", 2],
      ["deploy", 1],
    ]);
    expect(data.recentMemories).toEqual([{ name: "notes", calls: 1, lastUsedAt: expect.any(String) }]);
  });

  test("defaults to 30 days", async () => {
    const { data } = await body<ActivitySummaryView>(await call("/v1/activity/summary", { cookie: account.cookie }));
    expect(data.days).toBe(30);
    expect(data.daily).toHaveLength(30);
    expect(data.calls).toBe(6);
  });

  test("returns zeros and nulls for an organization without calls", async () => {
    const { data } = await body<ActivitySummaryView>(
      await call("/v1/activity/summary?days=1", { cookie: empty.cookie }),
    );
    expect(data).toMatchObject({ days: 1, calls: 0, errors: 0, errorRate: 0, changePercent: null, averageMs: null });
    expect(data.daily).toEqual([{ day: expect.any(String), calls: 0, context: 0, errors: 0 }]);
    expect(data.bySource).toEqual([]);
    expect(data.topTools).toEqual([]);
    expect(data.byKind).toEqual([]);
    expect(data.recentSkills).toEqual([]);
    expect(data.recentMemories).toEqual([]);
  });

  test("caps rankings at ten entries", async () => {
    const crowded = await signUp("Activity Crowded");
    for (let index = 0; index < 12; index += 1) seedCall(crowded.organizationId, `src${index}`, "t", true, 1, 0);
    const { data } = await body<ActivitySummaryView>(
      await call("/v1/activity/summary?days=1", { cookie: crowded.cookie }),
    );
    expect(data.bySource).toHaveLength(10);
    expect(data.topTools).toHaveLength(10);
  });

  test("rejects an out of range window", async () => {
    expect((await call("/v1/activity/summary?days=0", { cookie: account.cookie })).status).toBe(400);
    expect((await call("/v1/activity/summary?days=91", { cookie: account.cookie })).status).toBe(400);
  });

  test("requires authentication", async () => {
    expect((await call("/v1/activity/summary")).status).toBe(401);
  });

  test("returns STORAGE_FAILED when the query throws", () => {
    const result = withQueryFault(
      (sql) => sql.includes("FROM tool_calls"),
      () => summarizeActivity(account.organizationId, 7),
    );
    expect(result.error?.code).toBe("STORAGE_FAILED");
  });

  test("recordToolCall reports STORAGE_FAILED when the insert throws", () => {
    const result = withQueryFault(
      (sql) => sql.startsWith("INSERT INTO tool_calls"),
      () =>
        recordToolCall({
          organizationId: account.organizationId,
          apiKeyId: null,
          source: "s",
          tool: "t",
          ok: true,
          durationMs: 1,
        }),
    );
    expect(result.error?.code).toBe("STORAGE_FAILED");
  });
});

describe("onboarding", () => {
  test("a fresh organization has nothing done", async () => {
    const fresh = await signUp("Onboarding Fresh");
    const response = await call("/v1/onboarding", { cookie: fresh.cookie });
    const { data } = await body<OnboardingView>(response);
    expect(response.status).toBe(200);
    expect(data.completed).toBe(0);
    expect(data.total).toBe(3);
    expect(data.steps.map((step) => [step.id, step.done])).toEqual([
      ["source", false],
      ["api_key", false],
      ["agent", false],
    ]);
  });

  test("tracks api key, source and agent steps", async () => {
    const progressing = await signUp("Onboarding Progress");
    await createApiKey(progressing);
    let view = await body<OnboardingView>(await call("/v1/onboarding", { cookie: progressing.cookie }));
    expect(view.data.completed).toBe(1);
    expect(view.data.steps.find((step) => step.id === "api_key")?.done).toBe(true);
    seedCall(progressing.organizationId, "github", "x", true, 1, 0);
    db.query("INSERT INTO sources (organization_id, name, config, oauth) VALUES (?, 'github', '{}', '{}')").run(
      progressing.organizationId,
    );
    view = await body<OnboardingView>(await call("/v1/onboarding", { cookie: progressing.cookie }));
    expect(view.data.completed).toBe(3);
    expect(view.data.steps.every((step) => step.done)).toBe(true);
  });

  test("returns STORAGE_FAILED when the progress query throws", () => {
    const result = withQueryFault(
      (sql) => sql.includes("AS completed"),
      () => describeOnboarding(account.organizationId),
    );
    expect(result.error?.code).toBe("STORAGE_FAILED");
  });

  test("requires authentication", async () => {
    expect((await call("/v1/onboarding")).status).toBe(401);
  });
});

describe("tools", () => {
  test("lists live tools for the organization", async () => {
    const response = await call("/v1/tools?query=issue&limit=5", { cookie: empty.cookie });
    expect(response.status).toBe(200);
    expect((await body<unknown[]>(response)).data).toEqual([]);
  });

  test("validates the limit", async () => {
    expect((await call("/v1/tools?limit=0", { cookie: empty.cookie })).status).toBe(400);
  });

  test("works with an api key", async () => {
    const key = await createApiKey(empty, "tools-key");
    expect((await call("/v1/tools", { bearer: key.key })).status).toBe(200);
  });
});
