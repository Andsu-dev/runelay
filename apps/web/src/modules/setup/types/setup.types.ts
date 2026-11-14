export type SetupStepId = "source" | "api_key" | "agent" | "import" | "sync";

export interface SetupStepDefinition {
  id: SetupStepId;
  title: string;
  description: string;
  doneSummary: string;
}

export interface SetupStepState extends SetupStepDefinition {
  index: number;
  done: boolean;
  reachable: boolean;
}
