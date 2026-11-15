import type {
  CreateSourceInput,
  ImportSourcesInput,
  ImportView,
  OAuthStartView,
  SourceAuthDetectionView,
  SourceStatus,
  SourcesSummaryView,
  SourceView,
  UpdateSourceInput,
} from "@runelay/shared";
import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export const sourcesQuery = queryOptions({
  queryKey: ["sources"],
  queryFn: () => api.get<SourceView[]>("/sources"),
});

export const sourcesByStatusQuery = (status: SourceStatus) =>
  queryOptions({
    queryKey: ["sources", { status }],
    queryFn: () => api.get<SourceView[]>(`/sources?status=${status}`),
  });

export const needsAuthQuery = sourcesByStatusQuery("needs_auth");

export const sourcesSummaryQuery = queryOptions({
  queryKey: ["sources", "summary"],
  queryFn: () => api.get<SourcesSummaryView>("/sources/summary"),
});

export const sourceQuery = (name: string) =>
  queryOptions({
    queryKey: ["sources", name],
    queryFn: () => api.get<SourceView>(`/sources/${encodeURIComponent(name)}`),
  });

export const sourceAuthQuery = (url: string) =>
  queryOptions({
    queryKey: ["source-auth", url],
    queryFn: () => api.post<SourceAuthDetectionView>("/sources/detect-auth", { url }),
    enabled: URL.canParse(url) && /^https?:\/\//.test(url),
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });

export const createSource = (input: CreateSourceInput) => api.post<SourceView>("/sources", input);

export const updateSource = (name: string, input: UpdateSourceInput) =>
  api.patch<SourceView>(`/sources/${encodeURIComponent(name)}`, input);

export const deleteSource = (name: string) => api.delete<null>(`/sources/${encodeURIComponent(name)}`);

export const testSource = (name: string) => api.post<SourceView>(`/sources/${encodeURIComponent(name)}/test`);

export const startSourceOAuth = (name: string) =>
  api.post<OAuthStartView>(`/sources/${encodeURIComponent(name)}/oauth`);

export const importSources = (input: ImportSourcesInput) => api.post<ImportView>("/sources/import", input);
