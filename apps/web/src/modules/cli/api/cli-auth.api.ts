import type { ApproveCliAuthInput, CliAuthRequestView } from "@runeley/shared";
import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export const cliAuthRequestQuery = (code: string) =>
  queryOptions({
    queryKey: ["cli-auth", code],
    queryFn: () => api.get<CliAuthRequestView>(`/cli/auth/requests/${encodeURIComponent(code)}`),
    staleTime: 0,
    gcTime: 0,
  });

export const approveCliAuth = (input: ApproveCliAuthInput) => api.post<CliAuthRequestView>("/cli/auth/approve", input);
