import { useSyncExternalStore } from "react";
import { readStorage, writeStorage } from "@/lib/storage";
import type { SetupStepId } from "@/modules/setup/types/setup.types";

const listeners = new Set<() => void>();
const cache = new Map<string, SetupStepId[]>();

const storageKey = (organizationId: string) => `runeley-setup:${organizationId}`;

const parse = (raw: string | null): SetupStepId[] => {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is SetupStepId => typeof id === "string") : [];
  } catch {
    return [];
  }
};

const readMarks = (organizationId: string) => {
  const cached = cache.get(organizationId);
  if (cached) return cached;
  const marks = parse(readStorage(storageKey(organizationId)));
  cache.set(organizationId, marks);
  return marks;
};

export const addSetupMark = (organizationId: string, id: SetupStepId) => {
  const next = [...new Set([...readMarks(organizationId), id])];
  cache.set(organizationId, next);
  writeStorage(storageKey(organizationId), JSON.stringify(next));
  for (const listener of listeners) listener();
};

export const useSetupMarks = (organizationId: string) =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => readMarks(organizationId),
  );
