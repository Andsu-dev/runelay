import type { CatalogConnectorView, CatalogView } from "@runelay/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { translate, translateError } from "@/lib/i18n";
import { openPendingTab, sendTab } from "@/lib/oauth-tab";
import { toast } from "@/lib/toast";
import { installConnector } from "@/modules/catalog/api/catalog.api";
import { onboardingQuery } from "@/modules/onboarding/api/onboarding.api";
import { deleteSource, sourcesQuery, startSourceOAuth } from "@/modules/sources/api/sources.api";

const CATALOG_KEY = ["catalog"];

export const INSTALL_MUTATION_KEY = ["catalog-install"];

export const useCatalogActions = (connector: CatalogConnectorView) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const sourceName = connector.sourceName ?? connector.id;

  const markInstalled = (installed: boolean) => {
    const nextName = installed ? sourceName : null;
    const nextStatus = installed ? (connector.auth === "oauth" ? "needs_auth" : "idle") : null;
    const snapshot = queryClient.getQueriesData<CatalogView>({ queryKey: CATALOG_KEY });
    queryClient.setQueriesData<CatalogView>({ queryKey: CATALOG_KEY }, (catalog) =>
      catalog
        ? {
            sections: catalog.sections.map((section) => ({
              ...section,
              items: section.items.map((item) =>
                item.id === connector.id ? { ...item, installed, sourceName: nextName, status: nextStatus } : item,
              ),
            })),
          }
        : catalog,
    );
    return snapshot;
  };

  const restore = (snapshot: ReturnType<typeof markInstalled> | undefined) => {
    for (const [key, data] of snapshot ?? []) queryClient.setQueryData(key, data);
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: CATALOG_KEY });
    queryClient.invalidateQueries({ queryKey: sourcesQuery.queryKey });
    queryClient.invalidateQueries({ queryKey: onboardingQuery.queryKey });
  };

  const redirectToLogin = async (name: string, tab: Window | null) => {
    const { authorizationUrl } = await startSourceOAuth(name);
    return sendTab(tab, authorizationUrl);
  };

  const install = useMutation({
    mutationKey: INSTALL_MUTATION_KEY,
    mutationFn: async ({ tab, token }: { tab: Window | null; token?: string }) => {
      const source = await installConnector(connector.id, token);
      const redirecting = tab ? await redirectToLogin(source.name, tab) : false;
      return { source, redirecting };
    },
    onMutate: () => markInstalled(true),
    onSuccess: ({ source, redirecting }) => {
      if (redirecting) return;
      if (source.status === "ok" || connector.auth !== "api_key")
        return toast(translate("catalog.toasts.installed", { name: connector.name }));
      toast(source.error ?? translate("catalog.toasts.tokenRejected", { name: connector.name }), "error");
      navigate({ to: "/connectors/$name", params: { name: source.name } });
    },
    onError: (error, { tab }, snapshot) => {
      tab?.close();
      restore(snapshot);
      toast(translateError(error), "error");
    },
    onSettled: refresh,
  });

  const reconnect = useMutation({
    mutationFn: (tab: Window | null) => redirectToLogin(sourceName, tab),
    onSuccess: (redirecting) => {
      if (!redirecting) toast(translate("catalog.toasts.alreadyConnected", { name: connector.name }));
    },
    onError: (error, tab) => {
      tab?.close();
      toast(translateError(error), "error");
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteSource(sourceName),
    onMutate: () => markInstalled(false),
    onSuccess: () => toast(translate("catalog.toasts.removed", { name: connector.name })),
    onError: (error, _input, snapshot) => {
      restore(snapshot);
      toast(translateError(error), "error");
    },
    onSettled: refresh,
  });

  const addAccount = useMutation({
    mutationKey: INSTALL_MUTATION_KEY,
    mutationFn: async ({ tab, name }: { tab: Window | null; name: string }) => {
      const source = await installConnector(connector.id, undefined, name);
      return redirectToLogin(source.name, tab);
    },
    onSuccess: (redirecting, { name }) => {
      if (!redirecting) toast(translate("catalog.toasts.installed", { name }));
    },
    onError: (error, { tab }) => {
      tab?.close();
      toast(translateError(error), "error");
    },
    onSettled: refresh,
  });

  const startInstall = (token?: string) =>
    install.mutate({ tab: connector.auth === "oauth" ? openPendingTab() : null, token });
  const startReconnect = () => reconnect.mutate(openPendingTab());
  const startAddAccount = (name: string, options?: { onSuccess?: () => void }) =>
    addAccount.mutate({ tab: openPendingTab(), name }, options);

  return { sourceName, install, reconnect, remove, addAccount, startInstall, startReconnect, startAddAccount };
};
