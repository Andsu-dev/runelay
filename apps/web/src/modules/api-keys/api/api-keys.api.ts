import type { ApiKeySecretView, ApiKeyView, CreateApiKeyInput, CreatedApiKeyView } from "@runeley/shared";
import { queryOptions } from "@tanstack/react-query";
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

export const createApiKey = (input: CreateApiKeyInput) => api.post<CreatedApiKeyView>("/api-keys", input);

export const deleteApiKey = (id: string) => api.delete<null>(`/api-keys/${encodeURIComponent(id)}`);
