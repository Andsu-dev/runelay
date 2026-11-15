import { translate } from "@/lib/i18n";
import { authMessages } from "@/modules/auth/i18n";

type ServerErrorName = keyof (typeof authMessages)["pt-BR"]["serverErrors"];

export const translateAuthError = (message: string | undefined) => {
  if (!message) return translate("auth.fallbackError");
  const entry = Object.entries(authMessages["pt-BR"].serverErrors).find(([, text]) => text === message);
  return entry ? translate(`auth.serverErrors.${entry[0] as ServerErrorName}`) : message;
};
