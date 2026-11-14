import type { ImportSourceInput } from "@runeley/shared";
import type { ClientId } from "@/constants/clients.constants";
import type { LocalCredential } from "@/types/credential.types";

export interface PlannedSource {
  agent: string;
  identity: string;
  source: ImportSourceInput;
  credential: LocalCredential | null;
}

export interface MigrationPlan {
  sources: PlannedSource[];
  localCommands: string[];
  namesByClient: Map<ClientId, { name: string; identity: string }[]>;
}
