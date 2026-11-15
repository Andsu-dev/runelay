import { defineMessages } from "@/lib/i18n/define-messages";

export const cliMessages = defineMessages(
  {
    openLink: "Abra o link que o runelay login mostrou no terminal.",
    authorize: {
      title: "Autorizar o runelay CLI",
      requestFrom: "Pedido de",
      checkCode: "Confira se é o mesmo código do terminal",
      scopeBefore: "O CLI vai ler e gravar memórias, habilidades e conexões da organização",
      scopeAfter: ".",
      approve: "Autorizar",
      cancel: "Cancelar",
      cancelled: "Login do CLI cancelado.",
    },
    authorized: {
      title: "Pronto, pode voltar para o terminal.",
      description: "O runelay CLI já recebeu a chave deste computador.",
    },
    error: {
      title: "Não deu para autorizar",
      fallback: "Rode runelay login de novo no terminal.",
    },
  },
  {
    openLink: "Open the link that runelay login printed in the terminal.",
    authorize: {
      title: "Authorize the runelay CLI",
      requestFrom: "Request from",
      checkCode: "Make sure it matches the code in the terminal",
      scopeBefore: "The CLI will read and write memories, skills and connections in the",
      scopeAfter: " organization.",
      approve: "Authorize",
      cancel: "Cancel",
      cancelled: "CLI sign-in canceled.",
    },
    authorized: {
      title: "Done, you can go back to the terminal.",
      description: "The runelay CLI already received this computer's key.",
    },
    error: {
      title: "Couldn't authorize",
      fallback: "Run runelay login again in the terminal.",
    },
  },
);
