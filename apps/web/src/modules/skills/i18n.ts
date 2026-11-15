import { defineMessages } from "@/lib/i18n/define-messages";

export const skillsMessages = defineMessages(
  {
    page: {
      title: "Habilidades",
      search: "Buscar habilidades",
      totalLoading: "Instruções que os agentes carregam quando precisam.",
      total: {
        one: "{count} habilidade. Os agentes carregam cada uma quando precisam.",
        other: "{count} habilidades. Os agentes carregam cada uma quando precisam.",
      },
    },
    list: {
      emptyQueryTitle: "Nenhuma habilidade com “{query}”",
      emptyTitle: "Nenhuma habilidade ainda",
      emptyQueryDescription: "Tente outro termo. A busca olha nome, descrição e conteúdo.",
      emptyDescription: "Importe as pastas de SKILL.md com o CLI: bun run import.",
    },
    detail: {
      back: "Habilidades",
      updatedAt: "atualizada em {date}",
      enable: "Ativar {name}",
      disable: "Desativar {name}",
    },
    toggle: {
      enabled: "{name} ativada.",
      disabled: "{name} desativada.",
    },
    body: {
      edit: "Editar",
      cancel: "Cancelar",
      save: "Salvar",
      saved: "Habilidade salva.",
      empty: "Sem conteúdo.",
    },
    files: {
      title: "Arquivos",
      dialogDescription: "Arquivo da habilidade",
    },
  },
  {
    page: {
      title: "Skills",
      search: "Search skills",
      totalLoading: "Instructions agents load when they need them.",
      total: {
        one: "{count} skill. Agents load each one when they need it.",
        other: "{count} skills. Agents load each one when they need it.",
      },
    },
    list: {
      emptyQueryTitle: "No skills matching “{query}”",
      emptyTitle: "No skills yet",
      emptyQueryDescription: "Try another term. Search looks at name, description and content.",
      emptyDescription: "Import your SKILL.md folders with the CLI: bun run import.",
    },
    detail: {
      back: "Skills",
      updatedAt: "updated {date}",
      enable: "Enable {name}",
      disable: "Disable {name}",
    },
    toggle: {
      enabled: "{name} enabled.",
      disabled: "{name} disabled.",
    },
    body: {
      edit: "Edit",
      cancel: "Cancel",
      save: "Save",
      saved: "Skill saved.",
      empty: "No content.",
    },
    files: {
      title: "Files",
      dialogDescription: "Skill file",
    },
  },
);
