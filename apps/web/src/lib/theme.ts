import { useSyncExternalStore } from "react";
import { runPageTransition } from "./page-transition";
import { readStorage, writeStorage } from "./storage";

export type Theme = "system" | "light" | "dark";

const STORAGE_KEY = "runelay-theme";
const THEMES: Theme[] = ["system", "light", "dark"];
const listeners = new Set<() => void>();

const storedTheme = (): Theme => {
  const value = readStorage(STORAGE_KEY);
  return THEMES.find((theme) => theme === value) ?? "system";
};

let current: Theme = storedTheme();

const applyTheme = (theme: Theme) => {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", theme === "dark" || (theme === "system" && prefersDark));
};

export const setTheme = (theme: Theme) => {
  if (theme === current) return;
  current = theme;
  writeStorage(STORAGE_KEY, theme === "system" ? null : theme);
  for (const listener of listeners) listener();
  runPageTransition(() => applyTheme(current));
};

export const nextTheme = (theme: Theme): Theme => THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length] ?? "system";

export const useTheme = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
  );
