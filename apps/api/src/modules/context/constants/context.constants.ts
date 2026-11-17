import type { MemoryType } from "@runelay/shared";

export const BRIEF_MAX_CHARS = 12_000;

export const BRIEF_MEMORY_SHARE = 0.6;

export const SNIPPET_TOKENS = 16;

export const BRIEF_TITLE = "# runelay: contexto";

export const BRIEF_PINNED_TITLE = "## Regras de ouro";

export const BRIEF_MEMORY_TITLE = "## Índice de memórias";

export const BRIEF_SKILL_TITLE = "## Habilidades";

export const BRIEF_TRUNCATED = "- ... (mais itens: use search_context)";

export const PINNED_TRUNCATED = "- ... more rules: call search_context or read_memory for the rest.";

export const BRIEF_FOOTER = [
  "## Como usar",
  "- Antes de agir num assunto, rode `search_context` no MCP runelay e abra o que importa com `read_memory` ou `read_skill`.",
  "- Siga a habilidade inteira (`read_skill` e `read_skill_file`) quando a tarefa bater com uma delas.",
  "- Fato, decisão ou regra nova vira memória com `write_memory`, nunca em arquivo local: o runelay é a fonte da verdade e todos os agentes leem dele.",
].join("\n");

export const MEMORY_TYPE_TITLES: Record<MemoryType, string> = {
  user: "Sobre a pessoa",
  feedback: "Como trabalhar",
  project: "Projetos",
  reference: "Referências",
};
