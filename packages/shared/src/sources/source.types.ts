import type { z } from "zod";
import type {
  createSourceSchema,
  importedOAuthSchema,
  importSourceSchema,
  importSourcesSchema,
  listSourcesSchema,
  mcpRemoteConfigSchema,
  openApiConfigSchema,
  sourceConfigSchema,
  sourceStatusSchema,
  stdioConfigSchema,
  updateSourceSchema,
} from "./source.schema";

export type SourceConfig = z.infer<typeof sourceConfigSchema>;
export type McpRemoteConfig = z.infer<typeof mcpRemoteConfigSchema>;
export type StdioConfig = z.infer<typeof stdioConfigSchema>;
export type OpenApiConfig = z.infer<typeof openApiConfigSchema>;
export type SourceKind = SourceConfig["kind"];
export type SourceStatus = z.infer<typeof sourceStatusSchema>;
export type CreateSourceInput = z.infer<typeof createSourceSchema>;
export type UpdateSourceInput = z.infer<typeof updateSourceSchema>;
export type ImportSourcesInput = z.infer<typeof importSourcesSchema>;
export type ImportSourceInput = z.infer<typeof importSourceSchema>;
export type ImportedOAuthInput = z.infer<typeof importedOAuthSchema>;
export type ListSourcesInput = z.infer<typeof listSourcesSchema>;

export interface SourceView {
  name: string;
  config: SourceConfig;
  status: SourceStatus;
  error: string | null;
  toolCount: number;
  enabled: boolean;
  connectedAt: string | null;
  updatedAt: string;
  icon: string | null;
}

export interface OAuthStartView {
  authorizationUrl: string | null;
}

export interface SkippedSourceView {
  name: string;
  reason: string;
}

export interface ImportView {
  imported: string[];
  connected: string[];
  skipped: SkippedSourceView[];
}

export interface SourcesSummaryView {
  total: number;
  tools: number;
  attention: number;
}
