import { defineMessages } from "@/lib/i18n/define-messages";

export const cliMessages = defineMessages(
  {
    openLink: "Abra o link que o runelay login mostrou no terminal.",
    authorize: {
      title: "Liberar este computador",
      requestFrom: "Pedido de",
      checkCode: "Confira se é o mesmo código do terminal",
      scope: "Este computador vai poder usar suas contas, memórias e habilidades.",
      approve: "Autorizar",
      cancel: "Cancelar",
      cancelled: "Login do CLI cancelado.",
    },
    authorized: {
      title: "Pronto. Pode fechar esta aba e voltar ao Terminal.",
    },
    error: {
      title: "Não deu para autorizar",
      fallback: "Rode runelay login de novo no terminal.",
    },
  },
  {
    openLink: "Open the link that runelay login printed in the terminal.",
    authorize: {
      title: "Allow this computer",
      requestFrom: "Request from",
      checkCode: "Make sure it matches the code in the terminal",
      scope: "This computer will be able to use your accounts, memories and skills.",
      approve: "Authorize",
      cancel: "Cancel",
      cancelled: "CLI sign-in canceled.",
    },
    authorized: {
      title: "Done. You can close this tab and go back to Terminal.",
    },
    error: {
      title: "Couldn't authorize",
      fallback: "Run runelay login again in the terminal.",
    },
  },
);
