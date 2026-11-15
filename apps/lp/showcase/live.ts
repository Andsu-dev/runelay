import type { ActivitySummaryView } from "@runelay/shared";
import { useSyncExternalStore } from "react";
import { PREVIEW_ACTIVITY } from "@/modules/overview/constants/overview-preview.constants";

const INTERVAL = 4000;
const listeners = new Set<() => void>();
const visible = new Set<Element>();
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

let snapshot: ActivitySummaryView = PREVIEW_ACTIVITY;
let timer = 0;

const vary = (): ActivitySummaryView => {
  const daily = PREVIEW_ACTIVITY.daily.map((day) => {
    const calls = Math.max(40, Math.round(day.calls * (0.72 + Math.random() * 0.5)));
    const context = Math.round(calls * (day.context / Math.max(day.calls, 1)));
    const errors = Math.max(0, Math.round(day.errors * (0.5 + Math.random())));
    return { ...day, calls, context, errors };
  });
  const calls = daily.reduce((sum, day) => sum + day.calls, 0);
  const rerank = (items: ActivitySummaryView["byKind"]) => {
    const varied = items.map((item) => ({ ...item, calls: Math.round(item.calls * (0.75 + Math.random() * 0.5)) }));
    const total = varied.reduce((sum, item) => sum + item.calls, 0);
    return varied.map((item) => ({ ...item, share: item.calls / total }));
  };
  const errors = daily.reduce((sum, day) => sum + day.errors, 0);
  return {
    ...PREVIEW_ACTIVITY,
    daily,
    byKind: rerank(PREVIEW_ACTIVITY.byKind),
    bySource: rerank(PREVIEW_ACTIVITY.bySource),
    calls,
    errors,
    errorRate: errors / calls,
    changePercent: Math.round(8 + Math.random() * 18),
    averageMs: Math.round(360 + Math.random() * 120),
  };
};

const tick = () => {
  snapshot = vary();
  for (const listener of listeners) listener();
};

const sync = () => {
  const running = !reduced && visible.size > 0 && !document.hidden;
  if (running && !timer) timer = window.setInterval(tick, INTERVAL);
  if (!running && timer) {
    clearInterval(timer);
    timer = 0;
  }
};

document.addEventListener("visibilitychange", sync);

export const watchLive = (host: Element) =>
  new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting) visible.add(host);
    else visible.delete(host);
    sync();
  }).observe(host);

export const useLiveActivity = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => snapshot,
  );
