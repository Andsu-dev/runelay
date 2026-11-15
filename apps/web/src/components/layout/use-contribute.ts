import { useSyncExternalStore } from "react";
import { readStorage, writeStorage } from "@/lib/storage";
import { CONTRIBUTE_URL } from "@/modules/system/api/system.api";

const STORAGE_KEY = "runelay-contribute-seen";
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const readSeen = () => readStorage(STORAGE_KEY) === "true";

export const openContribute = () => {
  writeStorage(STORAGE_KEY, "true");
  for (const listener of listeners) listener();
  window.open(CONTRIBUTE_URL, "_blank");
};

export const useContributeSeen = () => useSyncExternalStore(subscribe, readSeen, readSeen);
