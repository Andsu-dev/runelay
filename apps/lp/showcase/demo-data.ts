import type {
  ApiKeyView,
  MeView,
  OnboardingView,
  VersionView,
  MemoryHealthView,
  MemoryListItemView,
  Page,
  SkillListItemView,
  SourceView,
} from "@runelay/shared";
import type { InfiniteData } from "@tanstack/react-query";

const NOW = Date.UTC(2026, 10, 14, 15);
const hoursAgo = (hours: number) => new Date(NOW - hours * 3_600_000).toISOString();

const source = (
  name: string,
  icon: string,
  url: string,
  toolCount: number,
  status: SourceView["status"] = "ok",
): SourceView => ({
  name,
  config: { kind: "mcp", url, headers: {} },
  status,
  error: null,
  toolCount: status === "ok" ? toolCount : 0,
  enabled: true,
  connectedAt: status === "ok" ? hoursAgo(240) : null,
  updatedAt: hoursAgo(3),
  icon,
  auth: "oauth",
  tokenUrl: null,
});

export const DEMO_SOURCES: SourceView[] = [
  source("linear", "linear", "https://mcp.linear.app/mcp", 84),
  source("github", "github", "https://api.githubcopilot.com/mcp", 51),
  { ...source("figma", "figma", "https://mcp.figma.com/mcp", 13), enabled: false },
  source("stripe", "stripe", "https://mcp.stripe.com", 32, "needs_auth"),
  source("supabase", "supabase", "https://mcp.supabase.com/mcp", 27),
  source("notion", "notion", "https://mcp.notion.com/mcp", 21),
  source("sentry", "sentry", "https://mcp.sentry.dev/mcp", 19),
  source("vercel", "vercel", "https://mcp.vercel.com", 14),
];

const memory = (
  slug: string,
  name: string,
  description: string,
  type: MemoryListItemView["type"],
  linkCount: number,
  backlinkCount: number,
  hours: number,
  pinned = false,
): MemoryListItemView => ({ slug, name, description, type, pinned, linkCount, backlinkCount, updatedAt: hoursAgo(hours) });

export const DEMO_MEMORIES: MemoryListItemView[] = [
  memory("team-rules", "Team rules", "How the team wants agents to work.", "feedback", 2, 2, 2, true),
  memory("deploy-checklist", "Deploy checklist", "Steps every agent follows before shipping to production.", "project", 2, 2, 5, true),
  memory("brand-voice", "Brand voice", "Tone for docs, release notes and landing pages.", "reference", 0, 3, 9),
  memory("checkout-timeouts", "Incident: checkout timeouts", "Postmortem of the October checkout outage.", "project", 1, 0, 26),
  memory("alex-preferences", "Alex's preferences", "How Alex likes answers and reviews.", "user", 0, 1, 30),
  memory("linear-workflow", "Linear workflow", "Statuses, labels and how agents should file issues.", "reference", 1, 2, 48),
  memory("billing-flow", "Billing flow", "Stripe checkout, webhooks and invoices.", "project", 1, 2, 72),
  memory("database-migrations", "Database migrations", "How to write and run migrations safely.", "reference", 1, 1, 96),
  memory("code-style", "Code style", "TypeScript conventions for the monorepo.", "feedback", 1, 1, 120),
];

export const DEMO_HEALTH: MemoryHealthView = {
  staleDays: 30,
  stale: [
    { slug: "code-style", name: "Code style", updatedAt: hoursAgo(24 * 41) },
    { slug: "database-migrations", name: "Database migrations", updatedAt: hoursAgo(24 * 37) },
    { slug: "billing-flow", name: "Billing flow", updatedAt: hoursAgo(24 * 33) },
  ],
  brokenLinks: [{ from: "deploy-checklist", to: "staging-setup" }],
  isolated: [
    { slug: "alex-preferences", name: "Alex's preferences", updatedAt: hoursAgo(30) },
    { slug: "brand-voice", name: "Brand voice", updatedAt: hoursAgo(9) },
  ],
  total: DEMO_MEMORIES.length,
};

const skill = (slug: string, name: string, description: string, enabled = true): SkillListItemView => ({
  slug,
  name,
  description,
  enabled,
  fileCount: 2,
  updatedAt: hoursAgo(12),
});

export const DEMO_SKILLS: SkillListItemView[] = [
  skill("code-review", "Code review", "Review a pull request for bugs, security and test coverage, with severity per finding."),
  skill("database-migration", "Database migration", "Write a safe, reversible migration following the team checklist."),
  skill("deploy", "Deploy", "Ship the current branch to production after the deploy checklist passes.", false),
  skill("frontend-polish", "Frontend polish", "Refine a React screen: spacing, motion, empty states and accessibility."),
  skill("support-reply", "Support reply", "Draft a reply to a customer ticket using the brand voice and account data."),
  skill("triage-sentry", "Triage Sentry errors", "Group new Sentry issues, find the root cause and open a Linear issue for each."),
  skill("weekly-report", "Weekly report", "Summarize the week from Linear, PostHog and Sentry into a short update."),
  skill("release-notes", "Write release notes", "Turn merged PRs into a changelog entry in the brand voice."),
];

const apiKey = (id: string, name: string, start: string, hours: number): ApiKeyView => ({
  id,
  name,
  start,
  createdAt: hoursAgo(24 * 21),
  lastRequest: hoursAgo(hours),
  recoverable: false,
});

export const DEMO_API_KEYS: ApiKeyView[] = [
  apiKey("key-claude", "Claude Code", "rnl_4f2a", 1),
  apiKey("key-codex", "Codex", "rnl_9c1e", 3),
  apiKey("key-cursor", "Cursor", "rnl_b73d", 8),
  apiKey("key-antigravity", "Antigravity", "rnl_e05b", 30),
];

export const DEMO_ME: MeView = {
  user: { id: "user-alex", email: "alex@acme.dev", name: "Alex", image: null },
  organization: { id: "org-acme", name: "Acme", slug: "acme", logo: null, role: "owner" },
  organizations: [{ id: "org-acme", name: "Acme", slug: "acme", logo: null, role: "owner" }],
};

export const DEMO_VERSION: VersionView = {
  current: "0.4.3",
  latest: "0.4.3",
  notes: null,
  releaseUrl: null,
  updateAvailable: false,
  canUpdate: false,
  desktop: false,
};

export const DEMO_ONBOARDING = {
  steps: ["source", "api_key", "agent", "import", "sync"].map((id) => ({ id, label: "", done: true, to: "/setup" })),
  completed: 5,
  total: 5,
} as unknown as OnboardingView;

export const page = <T,>(items: T[]): InfiniteData<Page<T>> => ({
  pages: [{ items, total: items.length, nextCursor: null }],
  pageParams: [0],
});
