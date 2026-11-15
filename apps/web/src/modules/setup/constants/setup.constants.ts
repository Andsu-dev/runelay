import type { SetupStepDefinition } from "@/modules/setup/types/setup.types";

export const SETUP_STEPS: SetupStepDefinition[] = [
  {
    id: "desktop",
    title: "setup.steps.desktop.title",
    description: "setup.steps.desktop.description",
    doneSummary: "setup.steps.desktop.doneSummary",
  },
  {
    id: "source",
    title: "setup.steps.source.title",
    description: "setup.steps.source.description",
    doneSummary: "setup.steps.source.doneSummary",
  },
  {
    id: "api_key",
    title: "setup.steps.apiKey.title",
    description: "setup.steps.apiKey.description",
    doneSummary: "setup.steps.apiKey.doneSummary",
  },
  {
    id: "agent",
    title: "setup.steps.agent.title",
    description: "setup.steps.agent.description",
    doneSummary: "setup.steps.agent.doneSummary",
  },
  {
    id: "import",
    title: "setup.steps.import.title",
    description: "setup.steps.import.description",
    doneSummary: "setup.steps.import.doneSummary",
  },
  {
    id: "sync",
    title: "setup.steps.sync.title",
    description: "setup.steps.sync.description",
    doneSummary: "setup.steps.sync.doneSummary",
  },
];

export const contextCommands = (origin: string, key: string) => ({
  importContext: `RUNELAY_URL=${origin} RUNELAY_API_KEY=${key} bun run import-context`,
  syncContext: `RUNELAY_URL=${origin} RUNELAY_API_KEY=${key} bun run sync-context`,
});

export const TIMELINE_EASE = [0.22, 1, 0.36, 1] as const;
