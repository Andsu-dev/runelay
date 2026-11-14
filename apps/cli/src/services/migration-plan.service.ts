import type { ImportedOAuthInput } from "@runeley/shared";
import type { ClientId } from "@/constants/clients.constants";
import { credentialsByUrl } from "@/services/credential-reader.service";
import type { ClientSource } from "@/types/client-config.types";
import type { LocalCredential } from "@/types/credential.types";
import type { MigrationPlan, PlannedSource } from "@/types/migration.types";

const oauthOf = (credential: LocalCredential): ImportedOAuthInput => ({
  clientId: credential.clientId,
  clientSecret: credential.clientSecret,
  accessToken: credential.accessToken,
  refreshToken: credential.refreshToken,
  expiresAt: credential.expiresAt,
  scope: credential.scope,
  tokenType: credential.tokenType,
});

export const planMigration = (clientSources: ClientSource[], credentials: LocalCredential[]): MigrationPlan => {
  const byUrl = credentialsByUrl(credentials);
  const byIdentity = new Map<string, PlannedSource>();
  const takenNames = new Set<string>();
  const localCommands = new Set<string>();
  const namesByClient = new Map<ClientId, { name: string; identity: string }[]>();

  for (const { client, agent, source, identity } of clientSources) {
    namesByClient.set(client, [...(namesByClient.get(client) ?? []), { name: source.name, identity }]);
    if (source.config.kind === "stdio") {
      localCommands.add(source.name);
      continue;
    }
    if (byIdentity.has(identity) || takenNames.has(source.name)) continue;
    const credential = source.config.kind === "mcp" ? (byUrl.get(identity) ?? null) : null;
    takenNames.add(source.name);
    byIdentity.set(identity, {
      agent,
      identity,
      credential,
      source: credential ? { ...source, oauth: oauthOf(credential) } : source,
    });
  }

  return { sources: [...byIdentity.values()], localCommands: [...localCommands], namesByClient };
};
