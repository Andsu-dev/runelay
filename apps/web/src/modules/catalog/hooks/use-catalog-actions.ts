import type { CatalogConnectorView, CatalogView } from "@runeley/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { openPendingTab, sendTab } from "@/lib/oauth-tab";
import { toast } from "@/lib/toast";
import { installConnector } from "@/modules/catalog/api/catalog.api";
import { onboardingQuery } from "@/modules/onboarding/api/onboarding.api";
import { deleteSource, sourcesQuery, startSourceOAuth } from "@/modules/sources/api/sources.api";

const CATALOG_KEY = ["catalog"];

export const INSTALL_MUTATION_KEY = ["catalog-install"];

export const useCatalogActions = (connector: CatalogConnectorView) => {
  const queryClient = useQueryClient();
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
    queryClient.invalidateQueries({ queryKey: sourcesQuery.queryKey });
    queryClient.invalidateQueries({ queryKey: onboardingQuery.queryKey });
  };

  const redirectToLogin = async (name: string, tab: Window | null) => {
    const { authorizationUrl } = await startSourceOAuth(name);
    return sendTab(tab, authorizationUrl);
  };

  const install = useMutation({
    mutationKey: INSTALL_MUTATION_KEY,
    mutationFn: async (tab: Window | null) => {
      const source = await installConnector(connector.id);
      const redirecting = tab ? await redirectToLogin(source.name, tab) : false;
      return { source, redirecting };
    },
    onMutate: () => markInstalled(true),
    onSuccess: ({ redirecting }) => {
      if (!redirecting) toast(`${connector.name} instalado.`);
    },
    onError: (error, tab, snapshot) => {
      tab?.close();
      restore(snapshot);
      toast(error.message, "error");
    },
    onSettled: refresh,
  });

  const reconnect = useMutation({
    mutationFn: (tab: Window | null) => redirectToLogin(sourceName, tab),
    onSuccess: (redirecting) => {
      if (!redirecting) toast(`${connector.name} já está conectado.`);
    },
    onError: (error, tab) => {
      tab?.close();
      toast(error.message, "error");
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteSource(sourceName),
    onMutate: () => markInstalled(false),
    onSuccess: () => toast(`${connector.name} removido.`),
    onError: (error, _input, snapshot) => {
      restore(snapshot);
      toast(error.message, "error");
    },
    onSettled: refresh,
  });

  const startInstall = () => install.mutate(connector.auth === "oauth" ? openPendingTab() : null);
  const startReconnect = () => reconnect.mutate(openPendingTab());

  return { sourceName, install, reconnect, remove, startInstall, startReconnect };
};
