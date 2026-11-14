import type { OnboardingStepView } from "@runeley/shared";

export const RANKING_LIMIT = 10;

export const ONBOARDING_STEPS: Omit<OnboardingStepView, "done">[] = [
  { id: "source", label: "Conecte sua primeira conta", to: "/setup" },
  { id: "api_key", label: "Crie uma chave de API", to: "/setup" },
  { id: "agent", label: "Use o runeley no seu agente", to: "/setup" },
];

export const EMPTY_TOTALS = { calls: 0, errors: 0, errorRate: 0, changePercent: null, averageMs: null };
