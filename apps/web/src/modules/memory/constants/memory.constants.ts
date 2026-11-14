import type { MemoryType } from "@runelay/shared";

export const MEMORY_TYPE_LABEL: Record<MemoryType, string> = {
  user: "Usuário",
  feedback: "Feedback",
  project: "Projeto",
  reference: "Referência",
};

export const MEMORY_TYPE_OPTIONS = [
  { value: "user", label: "Usuário" },
  { value: "feedback", label: "Feedback" },
  { value: "project", label: "Projeto" },
  { value: "reference", label: "Referência" },
] as const satisfies readonly { value: MemoryType; label: string }[];

export const MEMORY_FILTERS = [
  { value: "all", label: "Todas" },
  ...MEMORY_TYPE_OPTIONS,
  { value: "pinned", label: "Fixadas" },
] as const;

export type MemoryFilter = (typeof MEMORY_FILTERS)[number]["value"];

export const MEMORY_FILTER_VALUES = MEMORY_FILTERS.map((filter) => filter.value) as [MemoryFilter, ...MemoryFilter[]];

export const MEMORY_FILTER_TITLE: Record<MemoryFilter, string> = {
  all: "Memória",
  user: "Memórias de usuário",
  feedback: "Feedback",
  project: "Projetos",
  reference: "Referências",
  pinned: "Fixadas",
};

export const HEALTH_DAYS = 30;
