import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { openPendingTab, sendTab } from "@/lib/oauth-tab";
import { toast } from "@/lib/toast";
import { RECONNECT_POLL_MS, type ReconnectRowState } from "@/modules/reconnect/constants/reconnect.constants";
import { needsAuthQuery, sourcesQuery, startSourceOAuth } from "@/modules/sources/api/sources.api";

export const useReconnectQueue = () => {
  const queryClient = useQueryClient();
  const [waiting, setWaiting] = useState<string | null>(null);
  const { data: pending } = useSuspenseQuery({
    ...needsAuthQuery,
    refetchInterval: waiting ? RECONNECT_POLL_MS : false,
    refetchOnWindowFocus: "always",
  });
  const [initial] = useState(pending);
  const [skipped, setSkipped] = useState<string[]>([]);

  const pendingNames = new Set(pending.map((source) => source.name));
  const connected = initial.filter((source) => !pendingNames.has(source.name));
  const queue = initial.filter((source) => pendingNames.has(source.name) && !skipped.includes(source.name));
  const current = queue[0] ?? null;
  const waitingFor = waiting && queue.some((source) => source.name === waiting) ? waiting : null;

  const login = useMutation({
    mutationFn: async ({ name, tab }: { name: string; tab: Window | null }) => {
      const { authorizationUrl } = await startSourceOAuth(name);
      return sendTab(tab, authorizationUrl);
    },
    onMutate: ({ name }) => setWaiting(name),
    onSuccess: (redirecting) => {
      if (!redirecting) queryClient.invalidateQueries({ queryKey: sourcesQuery.queryKey });
    },
    onError: (error, { tab }) => {
      tab?.close();
      setWaiting(null);
      toast(error.message, "error");
    },
  });

  const connectCurrent = () => {
    if (current) login.mutate({ name: current.name, tab: openPendingTab() });
  };

  const skipCurrent = () => {
    if (!current) return;
    setSkipped((previous) => [...previous, current.name]);
    if (waiting === current.name) setWaiting(null);
  };

  const stateOf = (name: string): ReconnectRowState => {
    if (!pendingNames.has(name)) return "connected";
    if (skipped.includes(name)) return "skipped";
    if (name === waitingFor) return "waiting";
    return name === current?.name ? "next" : "queued";
  };

  return {
    initial,
    connected,
    queue,
    current,
    skippedCount: skipped.length,
    waitingFor,
    starting: login.isPending,
    connectCurrent,
    skipCurrent,
    stateOf,
  };
};
