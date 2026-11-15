import { useMutation, useQueryClient } from "@tanstack/react-query";
import { translate } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { unwrapBridge } from "@/modules/settings/api/desktop-server.api";
import { desktopStartupQuery } from "@/modules/settings/api/desktop-startup.api";
import type { RunelayDesktopBridge } from "@/types/runelay-desktop";

export const useSetStartup = (bridge: RunelayDesktopBridge) => {
  const queryClient = useQueryClient();
  const { queryKey } = desktopStartupQuery(bridge);

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!bridge.setStartup) throw new Error(translate("settings.startup.unsupported"));
      return unwrapBridge(bridge.setStartup(enabled));
    },
    onMutate: async (enabled) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      if (previous) queryClient.setQueryData(queryKey, { ...previous, openAtLogin: enabled });
      return previous;
    },
    onSuccess: ({ openAtLogin }) => {
      queryClient.setQueryData(queryKey, (current) => (current ? { ...current, openAtLogin } : current));
      toast(translate(openAtLogin ? "settings.startup.enabled" : "settings.startup.disabled"));
    },
    onError: (error, _enabled, previous) => {
      if (previous) queryClient.setQueryData(queryKey, previous);
      toast(error.message, "error");
    },
  });
};
