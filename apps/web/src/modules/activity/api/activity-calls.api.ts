import type { ActivityCallView, Page } from "@runelay/shared";
import { infiniteQueryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

const PAGE_SIZE = 40;

export interface ActivityCallsFilter {
  keyId?: string;
  source?: string;
  status?: "ok" | "error";
  query?: string;
}

const searchOf = (filter: ActivityCallsFilter, cursor: number) => {
  const params = new URLSearchParams({ cursor: String(cursor), limit: String(PAGE_SIZE) });
  for (const [key, value] of Object.entries(filter)) if (value) params.set(key, value);
  return params.toString();
};

export const activityCallsQuery = (filter: ActivityCallsFilter) =>
  infiniteQueryOptions({
    queryKey: ["activity", "calls", filter],
    queryFn: ({ pageParam }) => api.get<Page<ActivityCallView>>(`/activity/calls?${searchOf(filter, pageParam)}`),
    initialPageParam: 0,
    getNextPageParam: (page) => page.nextCursor,
    refetchInterval: 15_000,
  });
