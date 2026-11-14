import type { Result } from "@runelay/shared";
import type { JsonSchema, ToolArgs } from "@/modules/connectors/types/connector.types";

export interface SearchToolsInput {
  query?: string;
  source?: string;
  limit?: number;
}

export interface ToolSummary {
  name: string;
  description: string;
  inputSchema?: JsonSchema;
}

export interface ExecuteOutput {
  result: unknown;
  logs: string[];
}

export type ToolNamespace = Record<string, Record<string, (args?: ToolArgs) => Promise<Result<unknown>>>>;

export interface GatewayCaller {
  organizationId: string;
  apiKeyId: string | null;
}
