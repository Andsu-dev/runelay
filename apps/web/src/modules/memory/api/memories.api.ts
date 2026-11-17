import type {
  CreateMemoryInput,
  MemoryGraphView,
  MemoryHealthView,
  MemoryListItemView,
  MemoryType,
  MemoryVersionView,
  MemoryView,
  Page,
  UpdateMemoryInput,
} from "@runelay/shared";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

const PAGE_SIZE = 30;

export interface MemoryListFilter {
  query: string;
  type?: MemoryType;
  pinned?: boolean;
}

export const memoriesQuery = ({ query, type, pinned }: MemoryListFilter) =>
  infiniteQueryOptions({
    queryKey: ["memories", "list", { query, type, pinned }],
    queryFn: ({ pageParam }) =>
      api.get<Page<MemoryListItemView>>(
        `/memories?${new URLSearchParams({
          ...(query ? { query } : {}),
          ...(type ? { type } : {}),
          ...(pinned ? { pinned: "true" } : {}),
          cursor: String(pageParam),
          limit: String(PAGE_SIZE),
        })}`,
      ),
    initialPageParam: 0,
    getNextPageParam: (page) => page.nextCursor,
  });

export const memoryQuery = (slug: string) =>
  queryOptions({
    queryKey: ["memories", "detail", slug],
    queryFn: () => api.get<MemoryView>(`/memories/${encodeURIComponent(slug)}`),
  });

export const memoryVersionsQuery = (slug: string) =>
  queryOptions({
    queryKey: ["memories", "versions", slug],
    queryFn: () => api.get<MemoryVersionView[]>(`/memories/${encodeURIComponent(slug)}/versions`),
  });

export const memoryHealthQuery = (days: number) =>
  queryOptions({
    queryKey: ["memories", "health", days],
    queryFn: () => api.get<MemoryHealthView>(`/memories/health?days=${days}`),
  });

export const memoryGraphQuery = queryOptions({
  queryKey: ["memories", "graph"],
  queryFn: () => api.get<MemoryGraphView>("/memories/graph"),
});

export const createMemory = (input: CreateMemoryInput) => api.post<MemoryView>("/memories", input);

export const updateMemory = (slug: string, input: UpdateMemoryInput) =>
  api.patch<MemoryView>(`/memories/${encodeURIComponent(slug)}`, input);

export const deleteMemory = (slug: string) => api.delete<null>(`/memories/${encodeURIComponent(slug)}`);
