import { defineMessages } from "@/lib/i18n/define-messages";

export const searchMessages = defineMessages(
  {
    title: "Buscar",
    description: "Memórias, habilidades e tools",
    placeholder: "Buscar memórias, habilidades e tools",
    hint: "Busque memórias, habilidades e tools de todos os conectores.",
    empty: "Nada encontrado para “{term}”.",
    groups: { memories: "Memórias", skills: "Habilidades", tools: "Tools" },
  },
  {
    title: "Search",
    description: "Memories, skills and tools",
    placeholder: "Search memories, skills and tools",
    hint: "Search memories, skills and tools across every connector.",
    empty: "Nothing found for “{term}”.",
    groups: { memories: "Memories", skills: "Skills", tools: "Tools" },
  },
);
