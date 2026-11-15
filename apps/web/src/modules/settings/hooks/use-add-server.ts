import { useMutation, useQueryClient } from "@tanstack/react-query";
import { translate } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { desktopServersQuery, unwrapBridge } from "@/modules/settings/api/desktop-server.api";
import type { RunelayDesktopBridge } from "@/types/runelay-desktop";

export const useAddServer = (bridge: RunelayDesktopBridge) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { name?: string; url: string }) => unwrapBridge(bridge.addServer(input)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: desktopServersQuery(bridge).queryKey });
      toast(translate("settings.servers.added"));
    },
  });
};
