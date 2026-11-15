import type { ActivitySummaryView, RankedCountView, SourcesSummaryView } from "@runelay/shared";

const PREVIEW_END = Date.UTC(2026, 10, 13);
const DAY_MS = 86_400_000;

const DAILY_CALLS = [
  182, 214, 236, 198, 121, 96, 224, 251, 268, 240, 232, 138, 104, 262, 289, 301, 276, 259, 152, 118, 295, 318, 332, 307,
  284, 171, 129, 326, 348, 361,
];

const DAILY_ERRORS = [3, 5, 2, 4, 1, 0, 6, 3, 2, 8, 4, 1, 0, 3, 5, 2, 3, 4, 1, 1, 2, 7, 3, 2, 4, 2, 0, 3, 5, 2];

const CONTEXT_RATIOS = [0.32, 0.36, 0.41, 0.38, 0.44];

const daily = DAILY_CALLS.map((calls, index) => ({
  day: new Date(PREVIEW_END - (DAILY_CALLS.length - 1 - index) * DAY_MS).toISOString().slice(0, 10),
  calls,
  context: Math.round(calls * (CONTEXT_RATIOS[index % CONTEXT_RATIOS.length] ?? 0)),
  errors: DAILY_ERRORS[index] ?? 0,
}));

const totalCalls = DAILY_CALLS.reduce((sum, calls) => sum + calls, 0);
const totalErrors = DAILY_ERRORS.reduce((sum, errors) => sum + errors, 0);

const rank = (entries: [string, number][]): RankedCountView[] =>
  entries.map(([name, calls]) => ({ name, calls, share: calls / totalCalls }));

const hoursAgo = (hours: number) => new Date(PREVIEW_END - hours * 3_600_000).toISOString();

export const PREVIEW_ACTIVITY: ActivitySummaryView = {
  days: DAILY_CALLS.length,
  calls: totalCalls,
  errors: totalErrors,
  errorRate: totalErrors / totalCalls,
  changePercent: 18,
  averageMs: 412,
  daily,
  byKind: rank([
    ["connectors", 4210],
    ["skills", 1290],
    ["memories", 820],
    ["search", 712],
  ]),
  bySource: rank([
    ["linear", 1640],
    ["github", 1185],
    ["notion", 812],
    ["slack", 573],
  ]),
  topTools: rank([
    ["linear.list_issues", 742],
    ["github.get_pull_request", 518],
    ["notion.search", 455],
    ["linear.save_issue", 391],
    ["github.list_commits", 336],
    ["slack.send_message", 248],
  ]),
  recentSkills: [
    { name: "review-pr", calls: 214, lastUsedAt: hoursAgo(2) },
    { name: "criar-task-linear", calls: 168, lastUsedAt: hoursAgo(5) },
    { name: "release-notes", calls: 97, lastUsedAt: hoursAgo(26) },
    { name: "onboarding", calls: 58, lastUsedAt: hoursAgo(73) },
  ],
  recentMemories: [
    { name: "convencoes-de-commit", calls: 186, lastUsedAt: hoursAgo(1) },
    { name: "arquitetura-da-api", calls: 132, lastUsedAt: hoursAgo(9) },
    { name: "clientes-ativos", calls: 74, lastUsedAt: hoursAgo(30) },
    { name: "glossario", calls: 41, lastUsedAt: hoursAgo(96) },
  ],
};

export const PREVIEW_SOURCES: SourcesSummaryView = {
  total: 4,
  tools: 86,
  attention: 0,
};
