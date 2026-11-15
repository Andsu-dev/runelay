import { useSyncExternalStore } from "react";
import { runPageTransition } from "@/lib/page-transition";
import { readStorage, writeStorage } from "@/lib/storage";

export type Locale = "pt-BR" | "en";

export const LOCALES: Locale[] = ["pt-BR", "en"];

const STORAGE_KEY = "runelay-locale";
const listeners = new Set<() => void>();

const detectLocale = (): Locale => (navigator.language.toLowerCase().startsWith("pt") ? "pt-BR" : "en");

const storedLocale = (): Locale => {
  const value = readStorage(STORAGE_KEY);
  return LOCALES.find((locale) => locale === value) ?? detectLocale();
};

let current: Locale = storedLocale();
document.documentElement.lang = current;

export const getLocale = () => current;

const commitLocale = (locale: Locale) => {
  current = locale;
  writeStorage(STORAGE_KEY, locale);
  document.documentElement.lang = locale;
  for (const listener of listeners) listener();
};

export const setLocale = (locale: Locale) => {
  if (locale === current) return;
  runPageTransition(() => commitLocale(locale));
};

export const useLocale = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
  );
