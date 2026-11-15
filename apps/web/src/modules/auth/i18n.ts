import { defineMessages } from "@/lib/i18n/define-messages";

export const authMessages = defineMessages(
  {
    signin: {
      title: "Entrar",
      description: "Suas conexões ficam aqui, iguais em todos os agentes.",
      submit: "Entrar",
      switchPrompt: "Primeira vez?",
      switch: "Criar conta",
    },
    signup: {
      title: "Criar conta",
      description: "A primeira conta vira a dona deste runelay.",
      submit: "Criar conta",
      switchPrompt: "Já tem conta?",
      switch: "Entrar",
    },
    setup: {
      title: "Configurar este runelay",
      description: "Crie a conta dona. Ela administra conexões, memória e chaves deste servidor.",
      submit: "Criar conta dona",
      switchPrompt: "",
      switch: "",
    },
    fallbackError: "O servidor não respondeu. Tente de novo em instantes.",
    fields: {
      name: "Nome",
      email: "E-mail",
      setupToken: "Token de primeiro acesso",
      setupTokenHint:
        "Aparece no fim da instalação e no servidor em ~/runelay/.env (RUNELAY_SETUP_TOKEN). Pode colar o link inteiro.",
      password: "Senha",
      passwordHint: "Pelo menos 8 caracteres.",
    },
    serverErrors: {
      signupClosed: "Os cadastros estão fechados. Peça acesso a quem administra este runelay.",
      setupTokenRequired:
        "Para criar a primeira conta, use o link de primeiro acesso que aparece no log do servidor ou no fim da instalação.",
    },
  },
  {
    signin: {
      title: "Sign in",
      description: "Your connections live here, the same across every agent.",
      submit: "Sign in",
      switchPrompt: "First time?",
      switch: "Create account",
    },
    signup: {
      title: "Create account",
      description: "The first account becomes the owner of this runelay.",
      submit: "Create account",
      switchPrompt: "Already have an account?",
      switch: "Sign in",
    },
    setup: {
      title: "Set up this runelay",
      description: "Create the owner account. It manages this server's connections, memory and keys.",
      submit: "Create owner account",
      switchPrompt: "",
      switch: "",
    },
    fallbackError: "The server didn't respond. Try again in a moment.",
    fields: {
      name: "Name",
      email: "Email",
      setupToken: "First access token",
      setupTokenHint:
        "Shown at the end of the install and on the server in ~/runelay/.env (RUNELAY_SETUP_TOKEN). You can paste the whole link.",
      password: "Password",
      passwordHint: "At least 8 characters.",
    },
    serverErrors: {
      signupClosed: "Sign-ups are closed. Ask whoever runs this runelay for access.",
      setupTokenRequired:
        "To create the first account, use the first access link shown in the server log or at the end of the install.",
    },
  },
);
