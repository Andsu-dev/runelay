import type { MeView, SetupStatusView } from "@runelay/shared";
import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: () => api.get<MeView>("/me"),
  staleTime: Number.POSITIVE_INFINITY,
});

export const setupStatusQuery = queryOptions({
  queryKey: ["setup-status"],
  queryFn: () => api.get<SetupStatusView>("/setup"),
  staleTime: 0,
});
