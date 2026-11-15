import { useMutation, useQueryClient } from "@tanstack/react-query";
import { translate } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { desktopServersQuery, unwrapBridge } from "@/modules/settings/api/desktop-server.api";
import type { RunelayDesktopBridge } from "@/types/runelay-desktop";

export const useRemoveServer = (bridge: RunelayDesktopBridge) => {
  const queryClient = useQueryClient();
  const { queryKey } = desktopServersQuery(bridge);

  return useMutation({
    mutationFn: (id: string) => unwrapBridge(bridge.removeServer(id)),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      if (previous)
        queryClient.setQueryData(queryKey, {
          ...previous,
          servers: previous.servers.filter((server) => server.id !== id),
        });
      return previous;
    },
    onSuccess: () => toast(translate("settings.servers.removed")),
    onError: (error, _id, previous) => {
      if (previous) queryClient.setQueryData(queryKey, previous);
      toast(error.message, "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
};
