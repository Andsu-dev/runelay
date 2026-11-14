import type { CatalogView, SourceView } from "@runelay/shared";
import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export const catalogQuery = (query: string) =>
  queryOptions({
    queryKey: ["catalog", query],
    queryFn: () => api.get<CatalogView>(`/catalog?${new URLSearchParams(query ? { query } : {})}`),
  });

export const installConnector = (id: string, token?: string) => api.post<SourceView>("/catalog/install", { id, token });
