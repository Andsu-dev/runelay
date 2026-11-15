import { ComputerIcon, Delete02Icon, ServerStack01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/action/button";
import { IconAction } from "@/components/ui/action/icon-action";
import { UI_REDUCED_MOTION, UI_SPRING } from "@/components/ui/display/spring";
import { ConfirmPopover } from "@/components/ui/overlay/confirm-popover";
import { useT } from "@/lib/i18n";
import { SERVER_NAME_MAX_LENGTH } from "@/modules/settings/constants/settings.constants";
import type { DesktopServer } from "@/types/runelay-desktop";
import { InlineEditText } from "./inline-edit-text";

interface DesktopServerRowProps {
  server: DesktopServer;
  active: boolean;
  restarting: boolean;
  switchDisabled: boolean;
  onSwitch: () => void;
  onRename: (name: string) => void;
  onRemove: () => void;
}

const normalizeServerName = (draft: string) => {
  const name = draft.trim();
  return name && name.length <= SERVER_NAME_MAX_LENGTH ? name : null;
};

export function DesktopServerRow({
  server,
  active,
  restarting,
  switchDisabled,
  onSwitch,
  onRename,
  onRemove,
}: DesktopServerRowProps) {
  const t = useT();
  const reducedMotion = useReducedMotion();
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const local = server.kind === "local";

  return (
    <motion.div
      layout
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
      transition={reducedMotion ? UI_REDUCED_MOTION : UI_SPRING}
      className="flex min-h-12 items-center gap-3"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted/70 text-muted-foreground">
        <HugeiconsIcon icon={local ? ComputerIcon : ServerStack01Icon} size={16} strokeWidth={1.6} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        {local ? (
          <span className="flex h-8 items-center truncate text-[13px] font-medium">{server.name}</span>
        ) : (
          <InlineEditText
            value={server.name}
            normalize={normalizeServerName}
            onSave={onRename}
            inputLabel={t("settings.servers.nameLabel")}
            editLabel={t("settings.servers.rename")}
            saveLabel={t("settings.servers.saveName")}
            cancelLabel={t("settings.servers.cancel")}
            textClassName="font-medium text-foreground"
          />
        )}
        <span className="-mt-1 truncate text-[12px] text-muted-foreground">
          {server.url ?? t("settings.servers.thisComputer")}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {active ? (
          <span className="rounded-full bg-success/12 px-2 py-0.5 text-[11px] font-medium text-success">
            {t("settings.servers.active")}
          </span>
        ) : (
          <Button
            variant="glass"
            size="sm"
            loading={restarting}
            loadingText={t("settings.servers.restarting")}
            disabled={switchDisabled}
            onClick={onSwitch}
          >
            {t("settings.servers.use")}
          </Button>
        )}
        {!local && !active && (
          <ConfirmPopover
            open={confirmingRemove}
            onOpenChange={setConfirmingRemove}
            trigger={<IconAction icon={Delete02Icon} label={t("settings.servers.remove")} tone="destructive" />}
            title={t("settings.servers.removeTitle", { name: server.name })}
            description={t("settings.servers.removeDescription")}
            confirmLabel={t("settings.servers.remove")}
            onConfirm={onRemove}
          />
        )}
      </div>
    </motion.div>
  );
}
