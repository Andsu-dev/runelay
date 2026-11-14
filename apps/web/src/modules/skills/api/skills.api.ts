import type { Page, SkillFileView, SkillListItemView, SkillView, UpdateSkillInput } from "@runelay/shared";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

const PAGE_SIZE = 30;

export const skillsQuery = (query: string) =>
  infiniteQueryOptions({
    queryKey: ["skills", "list", query],
    queryFn: ({ pageParam }) =>
      api.get<Page<SkillListItemView>>(
        `/skills?${new URLSearchParams({ ...(query ? { query } : {}), cursor: String(pageParam), limit: String(PAGE_SIZE) })}`,
      ),
    initialPageParam: 0,
    getNextPageParam: (page) => page.nextCursor,
  });

export const skillQuery = (slug: string) =>
  queryOptions({
    queryKey: ["skills", "detail", slug],
    queryFn: () => api.get<SkillView>(`/skills/${encodeURIComponent(slug)}`),
  });

export const skillFileQuery = (slug: string, path: string) =>
  queryOptions({
    queryKey: ["skills", "file", slug, path],
    queryFn: () => api.get<SkillFileView>(`/skills/${encodeURIComponent(slug)}/files?${new URLSearchParams({ path })}`),
  });

export const updateSkill = (slug: string, input: UpdateSkillInput) =>
  api.patch<SkillView>(`/skills/${encodeURIComponent(slug)}`, input);
