import { queryOptions } from "@tanstack/react-query";
import type { DesktopStartup, RunelayDesktopBridge } from "@/types/runelay-desktop";

const UNSUPPORTED: DesktopStartup = { supported: false, openAtLogin: false };

export const desktopStartupQuery = (bridge: RunelayDesktopBridge | undefined) =>
  queryOptions({
    queryKey: ["desktop", "startup"],
    queryFn: () => bridge?.getStartup?.() ?? Promise.resolve(UNSUPPORTED),
    enabled: Boolean(bridge?.getStartup),
    staleTime: Number.POSITIVE_INFINITY,
  });
