import type { McpRemoteConfig, SourceView } from "@runelay/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
      toast(updated.enabled ? `${name} ativada.` : `${name} pausada.`);
    },
    onError: (error, _enabled, previous) => {
      if (previous) queryClient.setQueryData(sourcesQuery.queryKey, previous);
      toast(error.message, "error");
    },
    onSettled: refreshSummary,
  });

  const remove = useMutation({
    mutationFn: () => deleteSource(name),
    onMutate: () => patchList((sources) => sources.filter((source) => source.name !== name)),
    onSuccess: () => toast(`${name} removida.`),
    onError: (error, _input, previous) => {
      if (previous) queryClient.setQueryData(sourcesQuery.queryKey, previous);
      toast(error.message, "error");
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
      toast(`${name}: ${STATUS_LABEL[updated.status].toLowerCase()}.`, updated.status === "ok" ? "success" : "info");
    },
    onError: (error) => toast(error.message, "error"),
    onSettled: refreshSummary,
  });

  const login = useMutation({
    mutationFn: (_tab: Window | null) => startSourceOAuth(name),
    onSuccess: ({ authorizationUrl }, tab) => {
      if (sendTab(tab, authorizationUrl)) return;
      toast(`${name} já está conectada.`);
      queryClient.invalidateQueries({ queryKey: sourcesQuery.queryKey });
    },
    onError: (error, tab) => {
      tab?.close();
      toast(error.message, "error");
    },
  });

  const startLogin = () => login.mutate(openPendingTab());

  const saveToken = useMutation({
    mutationFn: ({ config, token }: { config: McpRemoteConfig; token: string }) =>
      updateSource(name, { config: { ...config, headers: { ...config.headers, Authorization: `Bearer ${token}` } } }),
    onSuccess: (updated) => {
      replaceInList(updated);
      queryClient.setQueryData(["sources", name], updated);
      if (updated.status === "ok") toast(`${name} conectada.`);
      else toast(updated.error ?? `${name}: ${STATUS_LABEL[updated.status].toLowerCase()}.`, "error");
    },
    onError: (error) => toast(error.message, "error"),
    onSettled: () => {
      refreshSummary();
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
  });

  return { toggle, remove, test, login, startLogin, saveToken };
};
