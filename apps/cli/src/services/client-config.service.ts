import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { attemptSync, type CreateSourceInput, type Result, sourceNameSchema } from "@runelay/shared";
import { parseClientConfig } from "@runelay/shared/importers";
import {
  CLIENT_AGENT_LABELS,
  CLIENT_CONFIG_FILES,
  type ClientId,
  JSON_SERVER_KEYS,
  TOML_HEADER_KEYS,
} from "@/constants/clients.constants";
import { normalizeMcpUrl } from "@/lib/url";
import type { ClientScan, ClientSource } from "@/types/client-config.types";

export const identityOf = ({ config }: CreateSourceInput) =>
  config.kind === "mcp"
    ? normalizeMcpUrl(config.url)
    : config.kind === "stdio"
      ? `stdio:${config.command} ${config.args.join(" ")}`
      : config.kind === "openapi"
        ? `openapi:${config.spec}`
        : `google:${config.services.join(",")}`;

export const scanClientConfigs = (): ClientScan => {
  const sources: ClientSource[] = [];
  const errors: string[] = [];
  for (const [client, file] of Object.entries(CLIENT_CONFIG_FILES) as [ClientId, string][]) {
    if (!existsSync(file)) continue;
    const parsed = parseClientConfig(readFileSync(file, "utf8"), process.env);
    if (parsed.error) {
      errors.push(`${CLIENT_AGENT_LABELS[client]}: ${parsed.error.message}`);
      continue;
    }
    for (const source of parsed.data)
      sources.push({ client, agent: CLIENT_AGENT_LABELS[client], source, identity: identityOf(source) });
  }
  return { sources, errors };
};

const normalizedName = (key: string) => {
  const parsed = sourceNameSchema.safeParse(key);
  return parsed.success ? parsed.data : null;
};

const pruneServerMap = (map: unknown, names: Set<string>) => {
  if (!map || typeof map !== "object") return 0;
  let removed = 0;
  for (const key of Object.keys(map)) {
    const name = normalizedName(key);
    if (!name || !names.has(name)) continue;
    delete (map as Record<string, unknown>)[key];
    removed += 1;
  }
  return removed;
};

const pruneJson = (file: string, names: Set<string>) => {
  const config = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
  let removed = 0;
  for (const key of JSON_SERVER_KEYS) removed += pruneServerMap(config[key], names);
  const projects = config.projects as Record<string, Record<string, unknown>> | undefined;
  for (const project of Object.values(projects ?? {})) removed += pruneServerMap(project?.mcpServers, names);
  if (removed) writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
  return removed;
};

const TOML_SERVER_HEADER = /^\s*\[\[?\s*mcp_servers\.(?:"([^"]+)"|'([^']+)'|([A-Za-z0-9_-]+))(?:\.[^\]]*)?\s*\]\]?\s*$/;

const pruneToml = (file: string, names: Set<string>) => {
  const removedNames = new Set<string>();
  let skipping = false;
  const kept = readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => {
      if (/^\s*\[/.test(line)) {
        const match = line.match(TOML_SERVER_HEADER);
        const name = match ? normalizedName(match[1] ?? match[2] ?? match[3] ?? "") : null;
        skipping = Boolean(name && names.has(name));
        if (skipping && name) removedNames.add(name);
      }
      return !skipping;
    });
  if (removedNames.size) writeFileSync(file, kept.join("\n"));
  return removedNames.size;
};

export const removeMigratedServers = (names: Map<ClientId, Set<string>>) =>
  [...names].map(([client, clientNames]): [ClientId, Result<number>] => {
    const file = CLIENT_CONFIG_FILES[client];
    const tomlClient = client in TOML_HEADER_KEYS;
    return [
      client,
      attemptSync(
        () => (clientNames.size && existsSync(file) ? (tomlClient ? pruneToml : pruneJson)(file, clientNames) : 0),
        "STORAGE_FAILED",
      ),
    ];
  });
