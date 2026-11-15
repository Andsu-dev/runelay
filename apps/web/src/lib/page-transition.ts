import { useSyncExternalStore } from "react";

const COVER_MS = 150;
const REDUCED_COVER_MS = 70;
const listeners = new Set<() => void>();

let active = false;
let pending: (() => void) | null = null;

const notify = () => {
  for (const listener of listeners) listener();
};

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const finish = () => {
  const apply = pending;
  pending = null;
  apply?.();
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      active = false;
      notify();
    }),
  );
};

export const runPageTransition = (apply: () => void) => {
  pending = apply;
  if (active) return;
  active = true;
  notify();
  setTimeout(() => requestAnimationFrame(finish), prefersReducedMotion() ? REDUCED_COVER_MS : COVER_MS);
};

export const usePageTransitionActive = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => active,
  );
