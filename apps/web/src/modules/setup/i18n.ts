import { defineMessages } from "@/lib/i18n/define-messages";

export const setupMessages = defineMessages(
  {
    page: {
      title: "Configurar agentes",
      description: "Cinco passos para o Claude, o Codex, o Cursor e o Grok usarem as mesmas contas e o mesmo contexto.",
    },
    keyPlaceholder: "rnl_SUA_CHAVE",
    progress: "{completed} de {total}",
    markDone: "Já fiz, próximo passo",
    openCatalog: "Abrir catálogo",
    createKey: "Criar chave",
    createAnotherKey: "Criar outra chave",
    copyClientConfig: "Copiar config do {client}",
    steps: {
      source: {
        title: "Conecte suas contas",
        description:
          "Linear, GitHub, Notion e o resto entram uma vez aqui. O login fica cifrado no runelay, nunca no agente.",
        doneSummary: "Contas conectadas.",
      },
      apiKey: {
        title: "Crie uma chave de API",
        description: "Uma chave por agente. Assim você revoga um sem derrubar os outros.",
        doneSummary: "Chave criada.",
      },
      agent: {
        title: "Ligue seus agentes",
        description: "Escolha o cliente e cole a config. Todos passam a enxergar as mesmas contas.",
        doneSummary: "Agentes ligados.",
      },
      import: {
        title: "Traga sua memória e suas habilidades",
        description:
          "Lê as memórias do Claude Code e as skills de ~/.claude/skills e manda para esta organização. Rode dentro do repo do runelay, uma vez.",
        doneSummary: "Contexto importado.",
      },
      sync: {
        title: "Mantenha o contexto em dia",
        description:
          "Grava um resumo curto no CLAUDE.md e nos AGENTS.md, entre marcadores. O resto o agente busca no MCP, e o que ele aprende volta como memória aqui.",
        doneSummary: "Contexto sincronizado.",
      },
    },
    keys: {
      unnamed: "Sem nome",
      unnamedInline: "sem nome",
      createdAt: "{name}, criada em {date}",
      copyKey: "Copiar chave",
      legacyPrefix: "A chave",
      legacySuffix: "foi criada antes do cofre e não pode ser recuperada.",
      legacyHint: "Crie outra: a partir de agora toda chave fica guardada cifrada.",
    },
    celebration: {
      dialogTitle: "Setup concluído",
      title: "Parabéns, você completou o setup!",
      description:
        "Seus agentes agora usam as mesmas contas, as mesmas habilidades e a mesma memória. O que um aprende, todos sabem.",
      follow: "Novidades do runelay saem primeiro por lá.",
    },
  },
  {
    page: {
      title: "Set up agents",
      description: "Five steps so Claude, Codex, Cursor and Grok share the same accounts and the same context.",
    },
    keyPlaceholder: "rnl_YOUR_KEY",
    progress: "{completed} of {total}",
    markDone: "Done, next step",
    openCatalog: "Open catalog",
    createKey: "Create key",
    createAnotherKey: "Create another key",
    copyClientConfig: "Copy {client} config",
    steps: {
      source: {
        title: "Connect your accounts",
        description:
          "Linear, GitHub, Notion and the rest get connected once, here. Credentials stay encrypted in runelay, never in the agent.",
        doneSummary: "Accounts connected.",
      },
      apiKey: {
        title: "Create an API key",
        description: "One key per agent, so you can revoke one without breaking the others.",
        doneSummary: "Key created.",
      },
      agent: {
        title: "Hook up your agents",
        description: "Pick the client and paste the config. They all see the same accounts.",
        doneSummary: "Agents hooked up.",
      },
      import: {
        title: "Bring your memory and skills",
        description:
          "Reads Claude Code memories and the skills in ~/.claude/skills and sends them to this organization. Run it once, inside the runelay repo.",
        doneSummary: "Context imported.",
      },
      sync: {
        title: "Keep context up to date",
        description:
          "Writes a short summary into CLAUDE.md and AGENTS.md, between markers. The agent fetches the rest over MCP, and what it learns comes back here as memory.",
        doneSummary: "Context synced.",
      },
    },
    keys: {
      unnamed: "Unnamed",
      unnamedInline: "unnamed",
      createdAt: "{name}, created {date}",
      copyKey: "Copy key",
      legacyPrefix: "The key",
      legacySuffix: "was created before the vault and can't be recovered.",
      legacyHint: "Create another one: from now on every key is stored encrypted.",
    },
    celebration: {
      dialogTitle: "Setup complete",
      title: "Congrats, you finished the setup!",
      description:
        "Your agents now share the same accounts, the same skills and the same memory. What one learns, they all know.",
      follow: "runelay news shows up there first.",
    },
  },
);
