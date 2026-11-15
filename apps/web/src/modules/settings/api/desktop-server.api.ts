import { queryOptions } from "@tanstack/react-query";
import type { RunelayDesktopBridge } from "@/types/runelay-desktop";

export const desktopServersQuery = (bridge: RunelayDesktopBridge) =>
  queryOptions({
    queryKey: ["desktop", "servers"],
    queryFn: () => bridge.listServers(),
    staleTime: Number.POSITIVE_INFINITY,
  });

export const unwrapBridge = async <T extends { error: string | null }>(call: Promise<T>) => {
  const result = await call;
  if (result.error) throw new Error(result.error);
  return result;
};
