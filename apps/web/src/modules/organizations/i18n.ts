import { defineMessages } from "@/lib/i18n/define-messages";

export const organizationsMessages = defineMessages(
  {
    switcher: {
      heading: "Organizações",
      create: "Nova organização",
      switched: "Agora em {name}.",
    },
    create: {
      title: "Nova organização",
      description: "Conectores, habilidades e memória ficam separados por organização.",
      name: "Nome",
      slug: "Identificador",
      slugHint: "Aparece na URL e no CLI.",
      submit: "Criar organização",
      submitting: "Criando",
      created: "{name} criada.",
    },
  },
  {
    switcher: {
      heading: "Organizations",
      create: "New organization",
      switched: "Now in {name}.",
    },
    create: {
      title: "New organization",
      description: "Connectors, skills and memory are kept separate per organization.",
      name: "Name",
      slug: "Identifier",
      slugHint: "Shows up in the URL and the CLI.",
      submit: "Create organization",
      submitting: "Creating",
      created: "{name} created.",
    },
  },
);
