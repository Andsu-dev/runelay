import {
  attempt,
  type ContextBriefView,
  type ContextClient,
  type CreateMemoryInput,
  type CreateSkillInput,
  type CreateSourceInput,
  fail,
  type ImportView,
  type Result,
} from "@runeley/shared";
import { cliEnv } from "@/config";

const requestApi = async <T>(method: "GET" | "POST", path: string, body?: unknown): Promise<Result<T>> => {
  const response = await attempt(
    () =>
      fetch(`${cliEnv.RUNELEY_URL}/v1${path}`, {
        method,
        headers: { authorization: `Bearer ${cliEnv.RUNELEY_API_KEY}`, "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    "UPSTREAM_FAILED",
  );
  if (response.error) return response;
  const parsed = await attempt(() => response.data.json() as Promise<Result<T>>, "UPSTREAM_FAILED");
  if (parsed.error) return fail("UPSTREAM_FAILED", `HTTP ${response.data.status}`);
  return parsed.data;
};

export const pushSources = (sources: CreateSourceInput[]) =>
  requestApi<ImportView>("POST", "/sources/import", { sources });

export const pushMemories = (memories: CreateMemoryInput[]) =>
  requestApi<{ imported: number }>("POST", "/memories/import", { memories });

export const pushSkills = (skills: CreateSkillInput[]) =>
  requestApi<{ imported: number }>("POST", "/skills/import", { skills });

export const fetchBrief = (client: ContextClient) =>
  requestApi<ContextBriefView>("GET", `/context/brief?client=${client}`);
