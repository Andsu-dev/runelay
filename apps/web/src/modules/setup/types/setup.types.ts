import type { MessageKey } from "@/lib/i18n";

export type SetupStepId = "desktop" | "agents" | "accounts";

export interface SetupStepDefinition {
  id: SetupStepId;
  title: MessageKey;
  description: MessageKey;
  doneSummary: MessageKey;
  skip: MessageKey;
}

export interface SetupStepState extends SetupStepDefinition {
  index: number;
  done: boolean;
  reachable: boolean;
}

export interface AgentPresence {
  name: string;
  used: boolean;
}
