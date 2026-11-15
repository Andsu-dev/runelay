import type { MessageKey } from "@/lib/i18n";

type LoginVariant = "signin" | "signup" | "setup";

interface LoginCopy {
  title: MessageKey;
  description: MessageKey;
  submit: MessageKey;
  switchPrompt: MessageKey;
  switch: MessageKey;
}

export const LOGIN_COPY: Record<LoginVariant, LoginCopy> = {
  signin: {
    title: "auth.signin.title",
    description: "auth.signin.description",
    submit: "auth.signin.submit",
    switchPrompt: "auth.signin.switchPrompt",
    switch: "auth.signin.switch",
  },
  signup: {
    title: "auth.signup.title",
    description: "auth.signup.description",
    submit: "auth.signup.submit",
    switchPrompt: "auth.signup.switchPrompt",
    switch: "auth.signup.switch",
  },
  setup: {
    title: "auth.setup.title",
    description: "auth.setup.description",
    submit: "auth.setup.submit",
    switchPrompt: "auth.setup.switchPrompt",
    switch: "auth.setup.switch",
  },
};
