import type { SetupStepDefinition } from "@/modules/setup/types/setup.types";

export const KEY_PLACEHOLDER = "rnl_SUA_CHAVE";

export const SETUP_STEPS: SetupStepDefinition[] = [
  {
    id: "source",
    title: "Conecte suas contas",
    description:
      "Linear, GitHub, Notion e o resto entram uma vez aqui. O login fica cifrado no runeley, nunca no agente.",
    doneSummary: "Contas conectadas.",
  },
  {
    id: "api_key",
    title: "Crie uma chave de API",
    description: "Uma chave por agente. Assim você revoga um sem derrubar os outros.",
    doneSummary: "Chave criada.",
  },
  {
    id: "agent",
    title: "Ligue seus agentes",
    description: "Escolha o cliente e cole a config. Todos passam a enxergar as mesmas contas.",
    doneSummary: "Agentes ligados.",
  },
  {
    id: "import",
    title: "Traga sua memória e suas habilidades",
    description:
      "Lê as memórias do Claude Code e as skills de ~/.claude/skills e manda para esta organização. Rode dentro do repo do runeley, uma vez.",
    doneSummary: "Contexto importado.",
  },
  {
    id: "sync",
    title: "Mantenha o contexto em dia",
    description:
      "Grava um resumo curto no CLAUDE.md e nos AGENTS.md, entre marcadores. O resto o agente busca no MCP, e o que ele aprende volta como memória aqui.",
    doneSummary: "Contexto sincronizado.",
  },
];

export const contextCommands = (origin: string, key: string) => ({
  importContext: `RUNELEY_URL=${origin} RUNELEY_API_KEY=${key} bun run import-context`,
  syncContext: `RUNELEY_URL=${origin} RUNELEY_API_KEY=${key} bun run sync-context`,
});

export const TIMELINE_EASE = [0.22, 1, 0.36, 1] as const;
