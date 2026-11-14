import type { Result } from "@runeley/shared";

export type JsonSchema = Record<string, unknown>;

export type ToolArgs = Record<string, unknown>;

export type ToolCall = (args: ToolArgs) => Promise<Result<unknown>>;

export interface Tool {
  name: string;
  source: string;
  description: string;
  inputSchema: JsonSchema;
  call: ToolCall;
}

export interface Connection {
  tools: Tool[];
  close: () => Promise<void>;
}

export type HttpVerb = "get" | "post" | "put" | "patch" | "delete";

export interface OpenApiParameter {
  name: string;
  in: "path" | "query" | "header" | "cookie" | "body";
  required?: boolean;
  description?: string;
  schema?: JsonSchema;
  type?: string;
}

export interface OpenApiOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: OpenApiParameter[];
  requestBody?: { required?: boolean; content?: Record<string, { schema?: JsonSchema }> };
}

export interface OpenApiDocument {
  servers?: { url: string }[];
  host?: string;
  basePath?: string;
  schemes?: string[];
  paths?: Record<string, Partial<Record<HttpVerb, OpenApiOperation>> & { parameters?: OpenApiParameter[] }>;
}
