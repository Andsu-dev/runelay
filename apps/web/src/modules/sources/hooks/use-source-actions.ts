import type { McpRemoteConfig, SourceView } from "@runelay/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { translate, translateError } from "@/lib/i18n";
import { openPendingTab, sendTab } from "@/lib/oauth-tab";
import { toast } from "@/lib/toast";
import {
  deleteSource,
  sourcesQuery,
  sourcesSummaryQuery,
  startSourceOAuth,
  testSource,
  updateSource,
} from "@/modules/sources/api/sources.api";
import { STATUS_LABEL } from "@/modules/sources/constants/source.constants";

export const useSourceActions = (name: string) => {
  const queryClient = useQueryClient();

  const patchList = (change: (sources: SourceView[]) => SourceView[]) => {
    const previous = queryClient.getQueryData(sourcesQuery.queryKey);
    if (previous) queryClient.setQueryData(sourcesQuery.queryKey, change(previous));
    return previous;
  };

  const replaceInList = (updated: SourceView) =>
    patchList((sources) => sources.map((source) => (source.name === updated.name ? updated : source)));

  const refreshSummary = () => queryClient.invalidateQueries({ queryKey: sourcesSummaryQuery.queryKey });

  const toggle = useMutation({
    mutationFn: (enabled: boolean) => updateSource(name, { enabled }),
    onMutate: (enabled) =>
      patchList((sources) => sources.map((source) => (source.name === name ? { ...source, enabled } : source))),
    onSuccess: (updated) => {
      replaceInList(updated);
      toast(translate(updated.enabled ? "sources.toasts.activated" : "sources.toasts.paused", { name }));
    },
    onError: (error, _enabled, previous) => {
      if (previous) queryClient.setQueryData(sourcesQuery.queryKey, previous);
      toast(translateError(error), "error");
    },
    onSettled: refreshSummary,
  });

  const remove = useMutation({
    mutationFn: () => deleteSource(name),
    onMutate: () => patchList((sources) => sources.filter((source) => source.name !== name)),
    onSuccess: () => toast(translate("sources.toasts.removed", { name })),
    onError: (error, _input, previous) => {
      if (previous) queryClient.setQueryData(sourcesQuery.queryKey, previous);
      toast(translateError(error), "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: sourcesQuery.queryKey });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding"] });
    },
  });

  const test = useMutation({
    mutationFn: () => testSource(name),
    onSuccess: (updated) => {
      replaceInList(updated);
      queryClient.setQueryData(["sources", name], updated);
      toast(
        translate("sources.toasts.tested", { name, status: translate(STATUS_LABEL[updated.status]).toLowerCase() }),
        updated.status === "ok" ? "success" : "info",
      );
    },
    onError: (error) => toast(translateError(error), "error"),
    onSettled: refreshSummary,
  });

  const login = useMutation({
    mutationFn: (_tab: Window | null) => startSourceOAuth(name),
    onSuccess: ({ authorizationUrl }, tab) => {
      if (sendTab(tab, authorizationUrl)) return;
      toast(translate("sources.toasts.alreadyConnected", { name }));
      queryClient.invalidateQueries({ queryKey: sourcesQuery.queryKey });
    },
    onError: (error, tab) => {
      tab?.close();
      toast(translateError(error), "error");
    },
  });

  const startLogin = () => login.mutate(openPendingTab());

  const saveToken = useMutation({
    mutationFn: ({ config, token }: { config: McpRemoteConfig; token: string }) =>
      updateSource(name, { config: { ...config, headers: { ...config.headers, Authorization: `Bearer ${token}` } } }),
    onSuccess: (updated) => {
      replaceInList(updated);
      queryClient.setQueryData(["sources", name], updated);
      if (updated.status === "ok") toast(translate("sources.toasts.connected", { name }));
      else
        toast(
          updated.error ??
            translate("sources.toasts.tested", { name, status: translate(STATUS_LABEL[updated.status]).toLowerCase() }),
          "error",
        );
    },
    onError: (error) => toast(translateError(error), "error"),
    onSettled: () => {
      refreshSummary();
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
  });

  return { toggle, remove, test, login, startLogin, saveToken };
};
