import { Add01Icon, ServerStack01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/action/button";
import { Skeleton } from "@/components/ui/display/skeleton";
import { UI_REDUCED_MOTION, UI_SPRING } from "@/components/ui/display/spring";
import { useT } from "@/lib/i18n";
import { desktopServersQuery } from "@/modules/settings/api/desktop-server.api";
import { useRemoveServer } from "@/modules/settings/hooks/use-remove-server";
import { useRenameServer } from "@/modules/settings/hooks/use-rename-server";
import { useSwitchServer } from "@/modules/settings/hooks/use-switch-server";
import type { RunelayDesktopBridge } from "@/types/runelay-desktop";
import { AddServerForm } from "./add-server-form";
import { DesktopServerRow } from "./desktop-server-row";
import { SettingsSection } from "./settings-section";

interface DesktopServersSectionProps {
  bridge: RunelayDesktopBridge;
}

export function DesktopServersSection({ bridge }: DesktopServersSectionProps) {
  const t = useT();
  const reducedMotion = useReducedMotion();
  const transition = reducedMotion ? UI_REDUCED_MOTION : UI_SPRING;
  const { data, error } = useQuery(desktopServersQuery(bridge));
  const switchServer = useSwitchServer(bridge);
  const renameServer = useRenameServer(bridge);
  const removeServer = useRemoveServer(bridge);
  const [adding, setAdding] = useState(false);
  const restartingId = switchServer.isPending || switchServer.isSuccess ? switchServer.variables : null;
  const servers = data
    ? [...data.servers].sort((a, b) => Number(b.id === data.active) - Number(a.id === data.active))
    : [];

  return (
    <SettingsSection icon={ServerStack01Icon} title={t("settings.servers.title")}>
      {data ? (
        <div className="flex flex-col gap-1">
          <AnimatePresence initial={false}>
            {servers.map((server) => (
              <DesktopServerRow
                key={server.id}
                server={server}
                active={server.id === data.active}
                restarting={restartingId === server.id}
                switchDisabled={Boolean(restartingId)}
                onSwitch={() => switchServer.mutate(server.id)}
                onRename={(name) => renameServer.mutate({ id: server.id, name })}
                onRemove={() => removeServer.mutate(server.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : error ? (
        <p className="text-[13px] text-destructive">{t("settings.server.readFailed")}</p>
      ) : (
        <Skeleton className="h-12 w-full" />
      )}
      <AnimatePresence initial={false} mode="wait">
        {adding ? (
          <motion.div
            key="form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transition}
            className="overflow-hidden"
          >
            <AddServerForm bridge={bridge} onDone={() => setAdding(false)} />
          </motion.div>
        ) : (
          <motion.div
            key="button"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={transition}
            className="flex"
          >
            <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
              <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={1.6} />
              {t("settings.servers.addServer")}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </SettingsSection>
  );
}
