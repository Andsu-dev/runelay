import type { MeView } from "@runelay/shared";
import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: () => api.get<MeView>("/me"),
  staleTime: Number.POSITIVE_INFINITY,
});
