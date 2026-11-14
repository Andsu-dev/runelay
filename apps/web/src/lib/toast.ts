import { useSyncExternalStore } from "react";
import { cue } from "./sound";

export type ToastTone = "success" | "info" | "error";

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

const commit = (next: Toast[]) => {
  toasts = next;
  for (const listener of listeners) listener();
};

const TONE_CUE = { success: "success", info: "attention", error: "error" } as const;

export const dismissToast = (id: number) => commit(toasts.filter((item) => item.id !== id));

export const toast = (message: string, tone: ToastTone = "success", duration = 3500) => {
  const id = nextId++;
  cue(TONE_CUE[tone]);
  commit([...toasts, { id, message, tone }]);
  setTimeout(() => dismissToast(id), duration);
};

export const useToasts = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => toasts,
  );
