import { defineMessages } from "@/lib/i18n/define-messages";

export const setupMessages = defineMessages(
  {
    page: {
      title: "Configurar agentes",
      description: "Poucos passos para todos os seus agentes usarem as mesmas contas e o mesmo contexto.",
    },
    progress: "{completed} de {total}",
    skip: "Pular por enquanto",
    later: "Deixar para depois",
    openCatalog: "Abrir catálogo",
    copyClientConfig: "Copiar config do {client}",
    agentKey: {
      create: "Gerar chave do {client}",
      creating: "Gerando a chave do {client}…",
      onceNote: "Esta chave é só do {client} e aparece só agora. Dá para revogar a qualquer momento em",
    },
    sourcesConnected: {
      one: "Você já tem {count} conta conectada.",
      other: "Você já tem {count} contas conectadas.",
    },
    reloginPending: {
      one: "1 conta pede login de novo.",
      other: "{count} contas pedem login de novo.",
    },
    relogin: "Entrar de novo",
    agents: {
      commandLabel: "Cole no Terminal (Aplicativos › Utilitários › Terminal) e aperte Enter",
      copyCommand: "Copiar comando",
      commandCaption: "Instala o runelay, abre o navegador para você aprovar e liga seus agentes. Leva 1 minuto.",
      waiting: "Esperando seus agentes aparecerem…",
      waitingHint: "Abra o Claude Code ou o Cursor e mande qualquer mensagem.",
      using: "{agent} está usando o runelay",
      notYet: "{agent} ainda não",
      notYetHint: "Abra o {agent} e mande qualquer mensagem.",
      named: "o {agent}",
      cursorRules:
        "Opcional: cole a regra do runelay em Cursor → Settings → Rules → User Rules para ele usar as memórias sempre.",
      advanced: "Configurar à mão (avançado)",
    },
    done: {
      title: "Tudo pronto.",
      using: "Usando o runelay:",
      tryIt: 'Abra o {agent} e peça: "o que você sabe sobre mim?"',
      overview: "Ir para a visão geral",
    },
    steps: {
      desktop: {
        title: "Deixe o runelay sempre ligado",
        description:
          "Os agentes só acham o runelay com o app rodando. Com esta opção ele abre junto com o computador, e fechar a janela o deixa na bandeja em vez de encerrar.",
        doneSummary: "Abre com o computador.",
      },
      agents: {
        title: "Ligue seus agentes",
        description:
          "Um comando só: ele traz suas memórias, habilidades e contas e liga todos os agentes do computador ao runelay.",
        doneSummary: "Agentes usando o runelay.",
        live: { one: "{agents} está usando o runelay.", other: "{agents} estão usando o runelay." },
        pending: { one: "{agents} entra quando você abrir ele.", other: "{agents} entram quando você abrir eles." },
      },
      accounts: {
        title: "Conecte as contas que ainda faltam",
        description:
          "Comece pelas que pedem login de novo. O login fica guardado com segurança no runelay, nunca no agente.",
        doneSummary: "Contas em dia.",
      },
    },
    desktop: {
      retry: "Tentar de novo",
      retryLabel: "Tentar conectar os agentes de novo",
      openFile: "Abrir arquivo",
      openFileLabel: "Abrir o arquivo de instruções",
      signIn: "Entrar nas contas",
      noAgents:
        "Não encontramos nenhum agente conhecido neste computador. Acabou de instalar um? Clique de novo. Usa outro app? Ligue ele aqui embaixo.",
      pendingLogins: "Contas que pedem para você entrar de novo: {count}",
      imported: "Trouxe {memories} memórias e {skills} habilidades para o runelay.",
      state: { pending: "Em andamento", ok: "Pronto", warn: "Precisa de atenção" },
      steps: {
        preparing: "Preparando…",
        detect: "Procurando seus agentes…",
        migrate: "Trazendo memórias e habilidades…",
        connect: "Ligando os agentes ao runelay…",
        pull: "Atualizando as instruções dos agentes…",
        doctor: "Conferindo se ficou tudo certo…",
      },
      agent: {
        pending: "Conectando o {agent}…",
        ready: "{agent} agora usa o runelay",
        memoryReady: "{agent} agora guarda as memórias no runelay",
        notHooked: "Não consegui ligar o {agent} ao runelay",
        memoryOn: "{agent} ainda guarda memórias por conta própria",
        detail: {
          notRegistered: "O runelay ainda não está na config de MCP dele. Tente de novo.",
          memoryOn: "A memória própria dele continua ligada.",
          memoryManual: "Desligue a memória própria dele nas configurações do app.",
          memoryError: "Não consegui conferir a memória dele.",
        },
      },
      errors: {
        generic: "Algo deu errado. Tente de novo.",
        unsupported: "Esta versão do app não consegue conectar os agentes. Atualize o runelay.",
        missingKey: "Este computador ainda não tem uma chave para este servidor.",
        cliFailed: "Não consegui conferir os agentes deste computador.",
        unauthorized: "A chave deste computador não vale mais neste servidor.",
        rateLimited: "Muitas tentativas seguidas. Espere um minuto e tente de novo.",
        unreachable: "Não consegui falar com o servidor do runelay.",
        details: "Detalhes",
      },
      checks: {
        instructions:
          "Um arquivo de instruções manda o agente guardar memórias fora do runelay. Abra e apague essa linha.",
        skills: "Algumas habilidades ainda não chegaram ao runelay",
        leftoverMemories: "Algumas memórias antigas ficaram neste computador",
      },
      agents: {
        title: "Conectar meus agentes",
        description:
          "Um clique: o runelay acha os agentes instalados neste computador, traz as memórias e habilidades deles e passa a cuidar de tudo.",
        doneDescription: "Seus agentes já usam o runelay. Instalou um agente novo? Confira de novo.",
        action: "Conectar meus agentes",
        recheck: "Conferir de novo",
      },
      manual: {
        toggle: "Meu agente não aparece aqui",
        explain:
          "Qualquer app que aceite um servidor MCP funciona. Cole estes dois valores nas configurações de MCP dele.",
        serverUrl: "URL do servidor",
        copyUrl: "Copiar URL do servidor",
        name: "Nome do agente",
        defaultName: "outro agente",
        generate: "Gerar chave",
        generateLabel: "Gerar uma chave só para este agente",
        header: "Cabeçalho",
        copyHeader: "Copiar cabeçalho Authorization",
        onceNote: "A chave aparece só agora e é só deste agente. Dá para revogar a qualquer momento em",
        keysLink: "Chaves de API",
        json: "Ou cole esta config pronta",
        copyJson: "Copiar config JSON",
        guides: "Ver guias por agente",
      },
      accounts: {
        title: "Conectar minhas contas",
        description:
          "Linear, GitHub, Notion e o resto entram uma vez aqui e aparecem em todos os agentes. O login fica guardado com segurança no runelay.",
        afterMigrate: {
          one: "O passo 1 já trouxe {count} conta dos seus agentes. Conecte aqui as contas que ainda faltam.",
          other: "O passo 1 já trouxe {count} contas dos seus agentes. Conecte aqui as contas que ainda faltam.",
        },
        action: "Conectar minhas contas",
        actionMissing: "Conectar as que faltam",
        skip: "Deixar para depois",
      },
    },
    celebration: {
      dialogTitle: "Tudo pronto",
      supportAction: "Apoie o projeto",
    },
  },
  {
    page: {
      title: "Set up agents",
      description: "A few steps so all your agents share the same accounts and the same context.",
    },
    progress: "{completed} of {total}",
    skip: "Skip for now",
    later: "Leave it for later",
    openCatalog: "Open catalog",
    copyClientConfig: "Copy {client} config",
    agentKey: {
      create: "Generate {client} key",
      creating: "Generating the {client} key…",
      onceNote: "This key belongs to {client} alone and shows only now. You can revoke it anytime in",
    },
    sourcesConnected: {
      one: "You already have {count} connected account.",
      other: "You already have {count} connected accounts.",
    },
    reloginPending: {
      one: "1 account needs you to sign in again.",
      other: "{count} accounts need you to sign in again.",
    },
    relogin: "Sign in again",
    agents: {
      commandLabel: "Paste it into Terminal (Applications › Utilities › Terminal) and press Enter",
      copyCommand: "Copy command",
      commandCaption:
        "Installs runelay, opens the browser for you to approve and hooks up your agents. Takes 1 minute.",
      waiting: "Waiting for your agents to show up…",
      waitingHint: "Open Claude Code or Cursor and send any message.",
      using: "{agent} is using runelay",
      notYet: "{agent} not yet",
      notYetHint: "Open {agent} and send any message.",
      named: "{agent}",
      cursorRules:
        "Optional: paste the runelay rule into Cursor → Settings → Rules → User Rules so it always uses your memories.",
      advanced: "Set it up by hand (advanced)",
    },
    done: {
      title: "All set.",
      using: "Using runelay:",
      tryIt: 'Open {agent} and ask: "what do you know about me?"',
      overview: "Go to overview",
    },
    steps: {
      desktop: {
        title: "Keep runelay always on",
        description:
          "Agents only find runelay while the app is running. With this option it opens with your computer, and closing the window keeps it in the tray instead of quitting.",
        doneSummary: "Opens with the computer.",
      },
      agents: {
        title: "Hook up your agents",
        description:
          "One command: it brings your memories, skills and accounts and hooks every agent on the computer up to runelay.",
        doneSummary: "Agents using runelay.",
        live: { one: "{agents} is using runelay.", other: "{agents} are using runelay." },
        pending: { one: "{agents} joins when you open it.", other: "{agents} join when you open them." },
      },
      accounts: {
        title: "Connect the accounts still missing",
        description:
          "Start with the ones asking to sign in again. Sign-ins stay safely stored in runelay, never in the agent.",
        doneSummary: "Accounts up to date.",
      },
    },
    desktop: {
      retry: "Try again",
      retryLabel: "Try connecting the agents again",
      openFile: "Open file",
      openFileLabel: "Open the instructions file",
      signIn: "Sign in to accounts",
      noAgents:
        "We didn't find any known agent on this computer. Just installed one? Click again. Using another app? Hook it up below.",
      pendingLogins: "Accounts asking you to sign in again: {count}",
      imported: "Brought {memories} memories and {skills} skills into runelay.",
      state: { pending: "In progress", ok: "Done", warn: "Needs attention" },
      steps: {
        preparing: "Getting ready…",
        detect: "Looking for your agents…",
        migrate: "Bringing memories and skills…",
        connect: "Hooking the agents up to runelay…",
        pull: "Updating the agents' instructions…",
        doctor: "Checking everything worked…",
      },
      agent: {
        pending: "Connecting {agent}…",
        ready: "{agent} now uses runelay",
        memoryReady: "{agent} now keeps its memories in runelay",
        notHooked: "Couldn't hook {agent} up to runelay",
        memoryOn: "{agent} still keeps memories on its own",
        detail: {
          notRegistered: "runelay isn't in its MCP config yet. Try again.",
          memoryOn: "Its own memory is still on.",
          memoryManual: "Turn off its own memory in the app's settings.",
          memoryError: "Couldn't check its memory.",
        },
      },
      errors: {
        generic: "Something went wrong. Try again.",
        unsupported: "This version of the app can't connect agents. Update runelay.",
        missingKey: "This computer doesn't have a key for this server yet.",
        cliFailed: "Couldn't check the agents on this computer.",
        unauthorized: "This computer's key no longer works on this server.",
        rateLimited: "Too many attempts in a row. Wait a minute and try again.",
        unreachable: "Couldn't reach the runelay server.",
        details: "Details",
      },
      checks: {
        instructions:
          "An instructions file tells the agent to save memories outside runelay. Open it and delete that line.",
        skills: "Some skills haven't reached runelay yet",
        leftoverMemories: "Some old memories were left on this computer",
      },
      agents: {
        title: "Connect my agents",
        description:
          "One click: runelay finds the agents installed on this computer, brings in their memories and skills, and takes care of the rest.",
        doneDescription: "Your agents already use runelay. Installed a new agent? Check again.",
        action: "Connect my agents",
        recheck: "Check again",
      },
      manual: {
        toggle: "My agent isn't listed",
        explain: "Any app that accepts an MCP server works. Paste these two values into its MCP settings.",
        serverUrl: "Server URL",
        copyUrl: "Copy server URL",
        name: "Agent name",
        defaultName: "other agent",
        generate: "Generate key",
        generateLabel: "Generate a key just for this agent",
        header: "Header",
        copyHeader: "Copy Authorization header",
        onceNote: "The key shows only now and belongs to this agent alone. You can revoke it anytime in",
        keysLink: "API keys",
        json: "Or paste this ready-made config",
        copyJson: "Copy JSON config",
        guides: "See guides per agent",
      },
      accounts: {
        title: "Connect my accounts",
        description:
          "Linear, GitHub, Notion and the rest get connected once, here, and show up in every agent. Sign-ins stay safely stored in runelay.",
        afterMigrate: {
          one: "Step 1 already brought {count} account from your agents. Connect the accounts still missing here.",
          other: "Step 1 already brought {count} accounts from your agents. Connect the accounts still missing here.",
        },
        action: "Connect my accounts",
        actionMissing: "Connect the missing ones",
        skip: "Leave it for later",
      },
    },
    celebration: {
      dialogTitle: "All set",
      supportAction: "Support the project",
    },
  },
);
