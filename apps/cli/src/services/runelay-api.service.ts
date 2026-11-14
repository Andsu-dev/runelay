import {
  attempt,
  type CliAuthPollView,
  type CliAuthStartView,
  type CliStatusView,
  type ContextBriefView,
  type ContextClient,
  type CreateMemoryInput,
  type CreateSkillInput,
  fail,
  type ImportSourceInput,
  type ImportView,
  ok,
  type Page,
  type Result,
  type SkillFileView,
  type SkillListItemView,
  type SkillView,
  type SourceStatus,
  type SourceView,
} from "@runelay/shared";
import { HEALTH_TIMEOUT_MS, SKILL_PAGE_SIZE } from "@/constants/cli.constants";
import type { Connection } from "@/types/config.types";

const requestApi = async <T>(
  url: string,
  method: "GET" | "POST" | "DELETE",
  path: string,
  options: { apiKey?: string; body?: unknown } = {},
): Promise<Result<T>> => {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (options.apiKey) headers.authorization = `Bearer ${options.apiKey}`;
  const response = await attempt(
    () =>
      fetch(`${url}/v1${path}`, {
        method,
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      }),
    "UPSTREAM_FAILED",
  );
  if (response.error) return fail("UPSTREAM_FAILED", `Não consegui falar com ${url}: ${response.error.message}`);
  const parsed = await attempt(() => response.data.json() as Promise<Result<T>>, "UPSTREAM_FAILED");
  if (parsed.error) return fail("UPSTREAM_FAILED", `${url} respondeu HTTP ${response.data.status}`);
  return parsed.data;
};

const authed = <T>(connection: Connection, method: "GET" | "POST" | "DELETE", path: string, body?: unknown) =>
  requestApi<T>(connection.url, method, path, { apiKey: connection.apiKey, body });

export const checkHealth = async (url: string) => {
  const response = await attempt(
    () => fetch(`${url}/health`, { signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS) }),
    "UPSTREAM_FAILED",
  );
  if (response.error || !response.data.ok) return false;
  const body = await attempt(() => response.data.text(), "UPSTREAM_FAILED");
  return body.data?.trim() === "ok";
};

export const startCliAuth = (url: string, device: string) =>
  requestApi<CliAuthStartView>(url, "POST", "/cli/auth", { body: { device } });

export const pollCliAuth = (url: string, pollToken: string) =>
  requestApi<CliAuthPollView>(url, "GET", `/cli/auth/${encodeURIComponent(pollToken)}`);

export const fetchStatus = (connection: Connection) => authed<CliStatusView>(connection, "GET", "/cli/status");

export const revokeCurrentKey = (connection: Connection) => authed<null>(connection, "DELETE", "/cli/key");

export const pushSources = (connection: Connection, sources: ImportSourceInput[]) =>
  authed<ImportView>(connection, "POST", "/sources/import", { sources });

export const pushMemories = (connection: Connection, memories: CreateMemoryInput[]) =>
  authed<{ imported: number }>(connection, "POST", "/memories/import", { memories });

export const pushSkills = (connection: Connection, skills: CreateSkillInput[]) =>
  authed<{ imported: number }>(connection, "POST", "/skills/import", { skills });

export const fetchBrief = (connection: Connection, client: ContextClient) =>
  authed<ContextBriefView>(connection, "GET", `/context/brief?client=${client}`);

export const listEnabledSkills = async (connection: Connection): Promise<Result<SkillListItemView[]>> => {
  const skills: SkillListItemView[] = [];
  let cursor: number | null = 0;
  while (cursor !== null) {
    const page: Result<Page<SkillListItemView>> = await authed<Page<SkillListItemView>>(
      connection,
      "GET",
      `/skills?enabled=true&cursor=${cursor}&limit=${SKILL_PAGE_SIZE}`,
    );
    if (page.error) return page;
    skills.push(...page.data.items);
    cursor = page.data.nextCursor;
  }
  return ok(skills);
};

export const fetchSkill = (connection: Connection, slug: string) =>
  authed<SkillView>(connection, "GET", `/skills/${encodeURIComponent(slug)}`);

export const fetchSkillFile = (connection: Connection, slug: string, path: string) =>
  authed<SkillFileView>(
    connection,
    "GET",
    `/skills/${encodeURIComponent(slug)}/files?path=${encodeURIComponent(path)}`,
  );

export const listSourcesByStatus = (connection: Connection, status: SourceStatus) =>
  authed<SourceView[]>(connection, "GET", `/sources?status=${status}`);
