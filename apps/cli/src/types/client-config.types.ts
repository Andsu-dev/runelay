import type { CreateSourceInput } from "@runelay/shared";
import type { ClientId } from "@/constants/clients.constants";

export interface ClientSource {
  client: ClientId;
  agent: string;
  source: CreateSourceInput;
  identity: string;
}

export interface ClientScan {
  sources: ClientSource[];
  errors: string[];
}
