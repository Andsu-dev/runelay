import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { attempt, fail, type GoogleConfig, type GoogleService, ok, type Result } from "@runelay/shared";
import { loadConnection } from "@/modules/connectors/clients/mcp.client";
import { CLIENT_INFO } from "@/modules/connectors/constants/connector.constants";
import type { Connection, Tool } from "@/modules/connectors/types/connector.types";
import { createGoogleApi } from "@/modules/google/clients/google-api.client";
import { GOOGLE_MCP_URLS, GOOGLE_SERVICE_LABELS } from "@/modules/google/constants/google.constants";
import { getGoogleAccessToken, missingServicesMessage } from "@/modules/google/services/google-auth.service";
import { accountTools } from "@/modules/google/tools/account.tools";
import { docsTools } from "@/modules/google/tools/docs.tools";
import { driveTools } from "@/modules/google/tools/drive.tools";
import { formsTools } from "@/modules/google/tools/forms.tools";
import { gmailTools } from "@/modules/google/tools/gmail.tools";
import { meetTools } from "@/modules/google/tools/meet.tools";
import { sheetsTools } from "@/modules/google/tools/sheets.tools";
import { slidesTools } from "@/modules/google/tools/slides.tools";
import type { GoogleFetch, GoogleToolDefinition } from "@/modules/google/types/google.types";
import { googleFetch } from "@/modules/google/utils/google-fetch";
import { missingScopes } from "@/modules/google/utils/google-scopes";
import { toGoogleTool } from "@/modules/google/utils/google-tool";
import { findSource } from "@/modules/sources/repositories/source.repository";
import type { SourceKey } from "@/modules/sources/types/source.types";

const REST_TOOLS: Partial<Record<GoogleService, GoogleToolDefinition[]>> = {
  docs: docsTools,
  sheets: sheetsTools,
  slides: slidesTools,
  drive: driveTools,
  gmail: gmailTools,
  forms: formsTools,
  meet: meetTools,
};

const authorizedFetch =
  (key: SourceKey): GoogleFetch =>
  async (input, init) => {
    const token = await getGoogleAccessToken(key);
    if (token.error) throw new Error(token.error.message);
    const headers = new Headers(init?.headers);
    headers.set("authorization", `Bearer ${token.data}`);
    return googleFetch(input, { ...init, headers });
  };

const connectMcpService = async (key: SourceKey, service: GoogleService, url: string): Promise<Result<Connection>> => {
  const client = new Client(CLIENT_INFO);
  const transport = new StreamableHTTPClientTransport(new URL(url), { fetch: authorizedFetch(key) });
  const connected = await attempt(() => client.connect(transport), "CONNECTION_FAILED");
  const loaded = connected.error ? connected : await loadConnection(client, key.name);
  if (loaded.error) return loaded;
  return ok({
    tools: loaded.data.tools.map((tool) => ({ ...tool, name: `${service}_${tool.name}` })),
    close: loaded.data.close,
  });
};

const restTools = (key: SourceKey, services: GoogleService[]): Tool[] => {
  const api = createGoogleApi(() => getGoogleAccessToken(key));
  const definitions = [
    ...accountTools,
    ...services.flatMap((service) =>
      (REST_TOOLS[service] ?? []).map((definition) => ({ ...definition, name: `${service}_${definition.name}` })),
    ),
  ];
  return definitions.map((definition) => toGoogleTool(definition, key.name, api));
};

export const connectGoogle = async (key: SourceKey, config: GoogleConfig): Promise<Result<Connection>> => {
  const source = findSource(key);
  if (source.error) return source;
  const granted = source.data.oauth.google?.scopes ?? [];
  if (!source.data.oauth.tokens || missingScopes(config.services, granted).length > 0) {
    return fail("NEEDS_AUTH", missingServicesMessage(config, granted));
  }
  const token = await getGoogleAccessToken(key);
  if (token.error) return token;
  const services = [...new Set(config.services)];
  const remote = await Promise.all(
    services.flatMap((service) => {
      const url = GOOGLE_MCP_URLS[service];
      return url ? [connectMcpService(key, service, url).then((result) => ({ service, result }))] : [];
    }),
  );
  const live = remote.flatMap(({ result }) => (result.data ? [result.data] : []));
  const failed = remote.flatMap(({ service, result }) =>
    result.error ? [`${GOOGLE_SERVICE_LABELS[service]} (${result.error.message})`] : [],
  );
  return ok({
    tools: [...live.flatMap((connection) => connection.tools), ...restTools(key, services)],
    close: async () => {
      await Promise.all(live.map((connection) => connection.close()));
    },
    ...(failed.length > 0 ? { warning: `Não foi possível carregar: ${failed.join("; ")}` } : {}),
  });
};
