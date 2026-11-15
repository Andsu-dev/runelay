import { useMutation } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { unwrapBridge } from "@/modules/settings/api/desktop-server.api";
import type { RunelayDesktopBridge } from "@/types/runelay-desktop";

export const useSwitchServer = (bridge: RunelayDesktopBridge) =>
  useMutation({
    mutationFn: (id: string) => unwrapBridge(bridge.switchServer(id)),
    onError: (error) => toast(error.message, "error"),
  });
