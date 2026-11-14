import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
let recentKey: string | null = null;

export const setRecentKey = (key: string) => {
  recentKey = key;
  for (const listener of listeners) listener();
};

export const useRecentKey = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => recentKey,
  );
