import { z } from "zod";

const stringMap = z.record(z.string(), z.coerce.string()).optional();

export const clientServerSchema = z.looseObject({
  type: z.string().optional(),
  url: z.string().optional(),
  httpUrl: z.string().optional(),
  headers: stringMap,
  http_headers: stringMap,
  env_http_headers: stringMap,
  bearer_token_env_var: z.string().optional(),
  command: z.string().optional(),
  args: z.array(z.coerce.string()).optional(),
  env: stringMap,
  enabled: z.boolean().optional(),
});

const serverMap = z.record(z.string(), z.unknown());

export const jsonClientConfigSchema = z.looseObject({
  mcpServers: serverMap.optional(),
  servers: serverMap.optional(),
  mcp: serverMap.optional(),
  projects: z.record(z.string(), z.looseObject({ mcpServers: serverMap.optional() })).optional(),
});

export const tomlClientConfigSchema = z.looseObject({
  mcp_servers: serverMap.optional(),
});
