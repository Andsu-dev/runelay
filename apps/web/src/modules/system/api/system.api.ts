import type { VersionView } from "@runelay/shared";
import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

const POLL_MS = 3000;
const POLL_LIMIT = 100;

export const DESKTOP_DOWNLOAD_URL = "https://runelay.com/download";

export const UPDATE_COMMAND = "cd ~/runelay && docker compose pull && docker compose up -d";

export const versionQuery = queryOptions({
  queryKey: ["system", "version"],
  queryFn: () => api.get<VersionView>("/system/version"),
  staleTime: 10 * 60 * 1000,
});

export const startUpdate = () => api.post<{ started: true }>("/system/update");

export const waitForVersionChange = async (from: string) => {
  for (let attempt = 0; attempt < POLL_LIMIT; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    const view = await api.get<VersionView>("/system/version").catch(() => null);
    if (view && view.current !== from) return true;
  }
  return false;
};
