import type { MessageKey } from "@/lib/i18n";

export type SetupStepId = "source" | "api_key" | "agent" | "import" | "sync";

export interface SetupStepDefinition {
  id: SetupStepId;
  title: MessageKey;
  description: MessageKey;
  doneSummary: MessageKey;
}

export interface SetupStepState extends SetupStepDefinition {
  index: number;
  done: boolean;
  reachable: boolean;
}
