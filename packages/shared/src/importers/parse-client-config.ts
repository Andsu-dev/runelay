import { attemptSync, ok } from "../result/result";
import type { Result } from "../result/result.types";
import { createSourceSchema } from "../sources/source.schema";
import type { CreateSourceInput } from "../sources/source.types";
import { clientServerSchema, jsonClientConfigSchema, tomlClientConfigSchema } from "./client-config.schema";
import { expandEnv } from "./expand-env";
import type { ClientServer, EnvMap } from "./importer.types";

const IGNORED = /runeley|executor/i;

const expandMap = (map: Record<string, string> | undefined, env: EnvMap) =>
  Object.fromEntries(Object.entries(map ?? {}).map(([key, value]) => [key, expandEnv(value, env)]));

const toSourceInput = (name: string, server: ClientServer, env: EnvMap): unknown => {
  const url = server.url ?? server.httpUrl;
  if (!url) {
    return {
      name,
      config: {
        kind: "stdio",
        command: server.command,
        args: (server.args ?? []).map((arg) => expandEnv(arg, env)),
        env: expandMap(server.env, env),
      },
    };
  }
  const headers = expandMap(server.headers ?? server.http_headers, env);
  const bearer = server.bearer_token_env_var && env[server.bearer_token_env_var];
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  for (const [header, variable] of Object.entries(server.env_http_headers ?? {})) {
    const value = env[variable];
    if (value) headers[header] = value;
  }
  return { name, config: { kind: "mcp", url: expandEnv(url, env), headers } };
};

export const sourcesFromServers = (servers: Record<string, unknown>, env: EnvMap): CreateSourceInput[] =>
  Object.entries(servers).flatMap(([name, raw]) => {
    const server = clientServerSchema.safeParse(raw);
    if (!server.success || server.data.enabled === false) return [];
    if (IGNORED.test(`${name} ${server.data.url ?? server.data.httpUrl ?? ""}`)) return [];
    const input = createSourceSchema.safeParse(toSourceInput(name, server.data, env));
    return input.success ? [input.data] : [];
  });

export const parseClientConfig = (text: string, env: EnvMap): Result<CreateSourceInput[]> => {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{")) {
    const toml = attemptSync(() => tomlClientConfigSchema.parse(Bun.TOML.parse(trimmed)), "INVALID_INPUT");
    if (toml.error) return toml;
    return ok(sourcesFromServers(toml.data.mcp_servers ?? {}, env));
  }
  const parsed = attemptSync(() => jsonClientConfigSchema.parse(JSON.parse(trimmed)), "INVALID_INPUT");
  if (parsed.error) return parsed;
  const projectServers = Object.values(parsed.data.projects ?? {}).map((project) => project.mcpServers ?? {});
  const servers = Object.assign(
    {},
    ...projectServers,
    parsed.data.mcp ?? {},
    parsed.data.servers ?? {},
    parsed.data.mcpServers ?? {},
  );
  return ok(sourcesFromServers(servers, env));
};
