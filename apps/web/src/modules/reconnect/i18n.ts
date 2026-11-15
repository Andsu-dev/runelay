import { defineMessages } from "@/lib/i18n/define-messages";

export const reconnectMessages = defineMessages(
  {
    banner: {
      pending: { one: "1 conta pede login", other: "{count} contas pedem login" },
      hint: "Faça todos em sequência.",
    },
    row: {
      connected: "Conectada",
      waiting: "Aguardando o login na outra aba",
      next: "Próxima",
      skipped: "Pulada",
      queued: "Na fila",
    },
    queue: {
      remaining: { one: "Falta 1 login", other: "Faltam {count} logins" },
      title: "Logins",
      description: "Cada conta abre o login numa aba nova. Quando você volta, ela já aparece conectada.",
      connect: "Conectar {name}",
      connectAll: "Conectar todas",
      skip: "Pular",
    },
    progress: "{done} de {total}",
    done: {
      none: "Nenhum login pendente",
      almost: "Quase tudo conectado",
      all: "Tudo conectado",
      skipped: {
        one: "Uma conta ficou para depois. Ela aparece em Conectores quando você quiser.",
        other: "{count} contas ficaram para depois. Ela aparece em Conectores quando você quiser.",
      },
      ready: "Seus agentes já enxergam essas contas pelo runelay.",
      viewConnectors: "Ver conectores",
    },
  },
  {
    banner: {
      pending: { one: "1 account needs sign-in", other: "{count} accounts need sign-in" },
      hint: "Do them all in one go.",
    },
    row: {
      connected: "Connected",
      waiting: "Waiting for sign-in in the other tab",
      next: "Next",
      skipped: "Skipped",
      queued: "Queued",
    },
    queue: {
      remaining: { one: "1 sign-in left", other: "{count} sign-ins left" },
      title: "Sign-ins",
      description: "Each account opens its sign-in in a new tab. When you come back, it already shows as connected.",
      connect: "Connect {name}",
      connectAll: "Connect all",
      skip: "Skip",
    },
    progress: "{done} of {total}",
    done: {
      none: "No pending sign-ins",
      almost: "Almost everything connected",
      all: "Everything connected",
      skipped: {
        one: "One account was left for later. It shows up in Connectors whenever you want.",
        other: "{count} accounts were left for later. They show up in Connectors whenever you want.",
      },
      ready: "Your agents already see these accounts through runelay.",
      viewConnectors: "View connectors",
    },
  },
);
