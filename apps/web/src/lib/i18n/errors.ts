import { ERROR_CATALOG } from "@runelay/shared";
import { ApiError } from "@/lib/api-client";
import { DICTIONARIES } from "./dictionary";
import { getLocale } from "./locale";

const SECTIONS = ["known", "validation"] as const;

export const translateMessage = (message: string) => {
  const target = DICTIONARIES[getLocale()].errors;
  const source = DICTIONARIES["pt-BR"].errors;
  for (const section of SECTIONS) {
    const entry = Object.entries(source[section]).find(([, text]) => text === message);
    if (entry) return (target[section] as Record<string, string>)[entry[0]] ?? message;
  }
  return message;
};

export const translateError = (error: unknown, fallback?: string) => {
  if (error instanceof ApiError && error.message === ERROR_CATALOG[error.code].message) {
    return DICTIONARIES[getLocale()].errors.codes[error.code];
  }
  if (error instanceof Error && error.message) return translateMessage(error.message);
  return fallback ?? DICTIONARIES[getLocale()].errors.codes.INTERNAL;
};
