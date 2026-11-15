import type { CatalogConnectorView } from "@runelay/shared";
import { useIsMutating } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/action/button";
import { useT } from "@/lib/i18n";
import { INSTALL_MUTATION_KEY, useCatalogActions } from "@/modules/catalog/hooks/use-catalog-actions";
import { TokenDialog } from "@/modules/sources/components/token-dialog";
import { InstallConnectorButton } from "./install-connector-button";
import { InstalledConnectorMenu } from "./installed-connector-menu";

interface CatalogItemActionsProps {
  connector: CatalogConnectorView;
  prominent?: boolean;
}

export function CatalogItemActions({ connector, prominent = false }: CatalogItemActionsProps) {
  const t = useT();
  const actions = useCatalogActions(connector);
  const installing = useIsMutating({ mutationKey: INSTALL_MUTATION_KEY }) > 0;
  const needsLogin = connector.installed && connector.status === "needs_auth";
  const [asking, setAsking] = useState(false);
  const state = needsLogin ? "login" : connector.installed ? "installed" : "available";
  const onInstall = () => (connector.auth === "api_key" ? setAsking(true) : actions.startInstall());

  return (
    <>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={state}
          className="flex items-center gap-1"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 480, damping: 32, mass: 0.6 }}
        >
          {state === "login" && (
            <Button
              variant="glass"
              size="sm"
              loading={actions.reconnect.isPending}
              disabled={installing}
              onClick={actions.startReconnect}
            >
              {t("catalog.finishLogin")}
            </Button>
          )}
          {state !== "available" && <InstalledConnectorMenu connector={connector} actions={actions} />}
          {state === "available" &&
            (prominent ? (
              <Button size="sm" disabled={installing} onClick={onInstall}>
                {t("catalog.featured.connect")}
              </Button>
            ) : (
              <InstallConnectorButton name={connector.name} pending={installing} onInstall={onInstall} />
            ))}
        </motion.div>
      </AnimatePresence>
      <TokenDialog
        name={connector.name}
        tokenUrl={connector.tokenUrl}
        open={asking}
        pending={actions.install.isPending}
        onOpenChange={setAsking}
        onSubmit={(token) => {
          setAsking(false);
          actions.startInstall(token);
        }}
      />
    </>
  );
}
