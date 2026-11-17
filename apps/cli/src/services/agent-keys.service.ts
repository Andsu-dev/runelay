import { hostname } from "node:os";
import type { AgentApiKeyView, Result } from "@runelay/shared";
import { AGENT_KEY_NAME_MAX } from "@/constants/cli.constants";
import { checkAgentKey, issueAgentKey } from "@/services/runelay-api.service";
import type { Connection } from "@/types/config.types";

export interface AgentKey {
  apiKey: string;
  keyName: string | null;
}

export interface AgentKeyDeps {
  issue: (name: string) => Promise<Result<AgentApiKeyView>>;
  works: (keyName: string, apiKey: string) => Promise<boolean>;
  host?: string;
}

export const hostLabel = (name = hostname()) => name.replace(/\.local$/, "") || "computer";

export const agentKeyName = (agent: string, host = hostLabel()) =>
  `${agent} · ${host}`.slice(0, AGENT_KEY_NAME_MAX).trim();

export const bearerKey = (authorization: unknown) =>
  typeof authorization === "string" ? (authorization.match(/^Bearer\s+(\S+)$/)?.[1] ?? null) : null;

export const resolveAgentKey = async (
  connection: Connection,
  agent: string,
  currentKey: string | null,
  { issue, works, host }: AgentKeyDeps,
): Promise<AgentKey> => {
  const keyName = agentKeyName(agent, host);
  if (currentKey && currentKey !== connection.apiKey && (await works(keyName, currentKey)))
    return { apiKey: currentKey, keyName };
  const issued = await issue(keyName);
  if (issued.error) return { apiKey: connection.apiKey, keyName: null };
  return { apiKey: issued.data.key, keyName: issued.data.name ?? keyName };
};

export const remoteAgentKeyDeps = (connection: Connection): AgentKeyDeps => ({
  issue: (name) => issueAgentKey(connection, name),
  works: (keyName, apiKey) => checkAgentKey(connection, keyName, apiKey),
});
