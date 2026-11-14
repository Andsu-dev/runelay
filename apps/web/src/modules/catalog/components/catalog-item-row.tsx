import type { CatalogConnectorView } from "@runelay/shared";
import { useIsMutating } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/action/button";
import { INSTALL_MUTATION_KEY, useCatalogActions } from "@/modules/catalog/hooks/use-catalog-actions";
import { TokenDialog } from "@/modules/sources/components/token-dialog";
import { ConnectorIcon } from "./connector-icon";
import { ConnectorStatusDot } from "./connector-status-dot";
import { InstallConnectorButton } from "./install-connector-button";
import { InstalledConnectorMenu } from "./installed-connector-menu";

interface CatalogItemRowProps {
  connector: CatalogConnectorView;
}

export function CatalogItemRow({ connector }: CatalogItemRowProps) {
  const actions = useCatalogActions(connector);
  const installing = useIsMutating({ mutationKey: INSTALL_MUTATION_KEY }) > 0;
  const needsLogin = connector.installed && connector.status === "needs_auth";
  const [asking, setAsking] = useState(false);
  const state = needsLogin ? "login" : connector.installed ? "installed" : "available";

  return (
    <div className="flex min-h-16 items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200 hover:bg-muted/50">
      <ConnectorIcon name={connector.name} icon={connector.icon} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-2">
          <span className="truncate text-[13px] font-semibold">{connector.name}</span>
          {connector.status && <ConnectorStatusDot status={connector.status} />}
        </span>
        <span className="line-clamp-1 text-[12px] text-muted-foreground">{connector.description}</span>
      </div>
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
              Concluir login
            </Button>
          )}
          {state !== "available" && <InstalledConnectorMenu connector={connector} actions={actions} />}
          {state === "available" && (
            <InstallConnectorButton
              name={connector.name}
              pending={installing}
              onInstall={() => (connector.auth === "api_key" ? setAsking(true) : actions.startInstall())}
            />
          )}
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
    </div>
  );
}
