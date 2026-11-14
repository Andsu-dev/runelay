import type { ContextHitView, ToolView } from "@runelay/shared";
import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export const contextSearchQuery = (query: string, kind: ContextHitView["kind"]) =>
  queryOptions({
    queryKey: ["context", "search", kind, query],
    queryFn: () => api.get<ContextHitView[]>(`/context/search?${new URLSearchParams({ query, kind, limit: "6" })}`),
    enabled: query.length > 0,
  });

export const toolSearchQuery = (query: string) =>
  queryOptions({
    queryKey: ["tools", query],
    queryFn: () => api.get<ToolView[]>(`/tools?${new URLSearchParams({ query, limit: "6" })}`),
    enabled: query.length > 0,
  });
