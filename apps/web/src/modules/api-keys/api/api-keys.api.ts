import type {
  ApiKeySecretView,
  ApiKeyView,
  AuditEventView,
  CreateApiKeyInput,
  CreatedApiKeyView,
  Page,
} from "@runelay/shared";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export const apiKeysQuery = queryOptions({
  queryKey: ["api-keys"],
  queryFn: () => api.get<ApiKeyView[]>("/api-keys"),
});

export const apiKeySecretQuery = (id: string) =>
  queryOptions({
    queryKey: ["api-keys", id, "secret"],
    queryFn: () => api.get<ApiKeySecretView>(`/api-keys/${encodeURIComponent(id)}/secret`),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 60_000,
  });

const ACTIVITY_PAGE_SIZE = 30;

export const apiKeyActivityQuery = (id: string) =>
  infiniteQueryOptions({
    queryKey: ["api-keys", id, "activity"],
    queryFn: ({ pageParam }) =>
      api.get<Page<AuditEventView>>(
        `/api-keys/${encodeURIComponent(id)}/activity?cursor=${pageParam}&limit=${ACTIVITY_PAGE_SIZE}`,
      ),
    initialPageParam: 0,
    getNextPageParam: (page) => page.nextCursor,
  });

export const createApiKey = (input: CreateApiKeyInput) => api.post<CreatedApiKeyView>("/api-keys", input);

export const deleteApiKey = (id: string) => api.delete<null>(`/api-keys/${encodeURIComponent(id)}`);
