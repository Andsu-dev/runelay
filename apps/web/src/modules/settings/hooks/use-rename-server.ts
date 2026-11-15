import { useMutation, useQueryClient } from "@tanstack/react-query";
import { translate } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { desktopServersQuery, unwrapBridge } from "@/modules/settings/api/desktop-server.api";
import type { RunelayDesktopBridge } from "@/types/runelay-desktop";

export const useRenameServer = (bridge: RunelayDesktopBridge) => {
  const queryClient = useQueryClient();
  const { queryKey } = desktopServersQuery(bridge);

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => unwrapBridge(bridge.renameServer(id, name)),
    onMutate: async ({ id, name }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      if (previous)
        queryClient.setQueryData(queryKey, {
          ...previous,
          servers: previous.servers.map((server) => (server.id === id ? { ...server, name } : server)),
        });
      return previous;
    },
    onSuccess: () => toast(translate("settings.servers.renamed")),
    onError: (error, _input, previous) => {
      if (previous) queryClient.setQueryData(queryKey, previous);
      toast(error.message, "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
};
