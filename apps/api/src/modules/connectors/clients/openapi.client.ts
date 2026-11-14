import { attempt, fail, type OpenApiConfig, ok, type Result } from "@runeley/shared";
import { ERROR_BODY_PREVIEW, OPENAPI_VERBS } from "@/modules/connectors/constants/connector.constants";
import type {
  Connection,
  HttpVerb,
  JsonSchema,
  OpenApiDocument,
  OpenApiOperation,
  OpenApiParameter,
  Tool,
  ToolArgs,
} from "@/modules/connectors/types/connector.types";
import { resolveRefs } from "@/modules/connectors/utils/resolve-refs";
import type { SourceKey } from "@/modules/sources/types/source.types";
import { guardedFetch } from "@/modules/sources/utils/guarded-fetch";

const loadDocument = async (spec: string): Promise<OpenApiDocument> => {
  const text = /^https?:\/\//.test(spec) ? await (await guardedFetch(spec)).text() : spec;
  return (text.trim().startsWith("{") ? JSON.parse(text) : Bun.YAML.parse(text)) as OpenApiDocument;
};

const resolveBaseUrl = (doc: OpenApiDocument, config: OpenApiConfig) => {
  if (config.baseUrl) return config.baseUrl.replace(/\/$/, "");
  const declared =
    doc.servers?.[0]?.url ?? (doc.host ? `${doc.schemes?.[0] ?? "https"}://${doc.host}${doc.basePath ?? ""}` : "");
  const base = /^https?:\/\//.test(config.spec) ? new URL(declared, config.spec).toString() : declared;
  return base.replace(/\/$/, "");
};

const buildInputSchema = (
  parameters: OpenApiParameter[],
  operation: OpenApiOperation,
  body?: JsonSchema,
): JsonSchema => {
  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];
  for (const parameter of parameters) {
    if (parameter.in !== "path" && parameter.in !== "query" && parameter.in !== "header") continue;
    properties[parameter.name] = {
      ...(parameter.schema ?? { type: parameter.type ?? "string" }),
      description: parameter.description,
    };
    if (parameter.required) required.push(parameter.name);
  }
  if (body) {
    properties.body = body;
    if (operation.requestBody?.required) required.push("body");
  }
  return { type: "object", properties, required };
};

const callOperation = async (
  request: { baseUrl: string; path: string; verb: HttpVerb; parameters: OpenApiParameter[]; config: OpenApiConfig },
  args: ToolArgs,
): Promise<Result<unknown>> => {
  const { baseUrl, path, verb, parameters, config } = request;
  const url = new URL(
    baseUrl + path.replace(/\{([^}]+)\}/g, (_, key: string) => encodeURIComponent(String(args[key]))),
  );
  const headers: Record<string, string> = { accept: "application/json", ...config.headers };
  for (const [key, value] of Object.entries(config.query)) url.searchParams.set(key, value);
  for (const parameter of parameters) {
    const value = args[parameter.name];
    if (value === undefined) continue;
    const serialized = typeof value === "object" ? JSON.stringify(value) : String(value);
    if (parameter.in === "query") url.searchParams.set(parameter.name, serialized);
    if (parameter.in === "header") headers[parameter.name] = serialized;
  }
  if (args.body !== undefined) headers["content-type"] = "application/json";

  const response = await attempt(
    () =>
      guardedFetch(url, {
        method: verb.toUpperCase(),
        headers,
        body: args.body === undefined ? undefined : JSON.stringify(args.body),
      }),
    "TOOL_FAILED",
  );
  if (response.error) return response;
  const text = await response.data.text();
  let data: unknown = text;
  try {
    data = JSON.parse(text);
  } catch {}
  if (!response.data.ok) {
    const preview = (typeof data === "string" ? data : JSON.stringify(data)).slice(0, ERROR_BODY_PREVIEW);
    return fail("TOOL_FAILED", `${response.data.status} ${preview}`, { status: response.data.status });
  }
  return ok(data);
};

export const connectOpenApi = async (
  { name: source }: SourceKey,
  config: OpenApiConfig,
): Promise<Result<Connection>> => {
  const doc = await attempt(() => loadDocument(config.spec), "CONNECTION_FAILED");
  if (doc.error) return doc;
  const baseUrl = resolveBaseUrl(doc.data, config);
  const tools: Tool[] = [];

  for (const [path, item] of Object.entries(doc.data.paths ?? {})) {
    for (const verb of OPENAPI_VERBS) {
      const operation = item[verb];
      if (!operation) continue;
      const parameters = resolveRefs([...(item.parameters ?? []), ...(operation.parameters ?? [])], doc.data);
      const body = resolveRefs(operation.requestBody, doc.data)?.content?.["application/json"]?.schema;
      tools.push({
        name: (operation.operationId ?? `${verb}_${path}`).replace(/[^a-zA-Z0-9_]+/g, "_").replace(/^_|_$/g, ""),
        source,
        description:
          [operation.summary, operation.description].filter(Boolean).join("\n\n").slice(0, 1000) ||
          `${verb.toUpperCase()} ${path}`,
        inputSchema: buildInputSchema(parameters, operation, body),
        call: (args) => callOperation({ baseUrl, path, verb, parameters, config }, args),
      });
    }
  }
  return ok({ tools, close: async () => {} });
};
