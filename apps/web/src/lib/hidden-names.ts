import { useSyncExternalStore } from "react";
import { readStorage, writeStorage } from "./storage";

const STORAGE_KEY = "runelay-hide-names";
const listeners = new Set<() => void>();

let hidden = readStorage(STORAGE_KEY) === "1";

export const setNamesHidden = (next: boolean) => {
  hidden = next;
  writeStorage(STORAGE_KEY, next ? "1" : null);
  for (const listener of listeners) listener();
};

export const maskName = (name: string) => "*".repeat(Math.min(Math.max(name.length, 4), 16));

export const readNamesHidden = () => hidden;

export const subscribeNamesHidden = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useNamesHidden = () => useSyncExternalStore(subscribeNamesHidden, readNamesHidden);
