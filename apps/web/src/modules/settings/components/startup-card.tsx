import { Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { UI_REDUCED_MOTION, UI_SPRING } from "@/components/ui/display/spring";
import { Switch } from "@/components/ui/form/switch";
import { useT } from "@/lib/i18n";
import { desktopStartupQuery } from "@/modules/settings/api/desktop-startup.api";
import { STARTUP_POINTS } from "@/modules/settings/constants/settings.constants";
import { useSetStartup } from "@/modules/settings/hooks/use-set-startup";
import type { RunelayDesktopBridge } from "@/types/runelay-desktop";
import { StartupIllustration } from "./startup-illustration";
import { StartupPoint } from "./startup-point";

interface StartupCardProps {
  bridge: RunelayDesktopBridge;
  onToggle?: (enabled: boolean) => void;
}

export function StartupCard({ bridge, onToggle }: StartupCardProps) {
  const t = useT();
  const reduce = useReducedMotion();
  const { data } = useQuery(desktopStartupQuery(bridge));
  const setStartup = useSetStartup(bridge);
  const on = Boolean(data?.openAtLogin);

  return (
    <div className="@container flex flex-col gap-3">
      <div className="grid gap-3 @lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] @lg:items-center @lg:gap-5">
        <StartupIllustration on={on} />
        <ul className="flex flex-col gap-2.5 px-1 @lg:px-0">
          {STARTUP_POINTS.map((point) => (
            <StartupPoint key={point.label} icon={point.icon} label={t(point.label)} />
          ))}
        </ul>
      </div>
      <div className="flex min-h-12 items-center gap-3 rounded-lg bg-muted/60 px-3 py-2 dark:bg-muted/40">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[13px] font-medium">{t("settings.startup.openAtLogin")}</span>
          <span className="truncate text-[12px] text-muted-foreground">
            {t("settings.startup.openAtLoginDescription")}
          </span>
        </span>
        <AnimatePresence initial={false}>
          {on && (
            <motion.span
              key="on"
              initial={{ opacity: 0, scale: 0.9, x: 6 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 6 }}
              transition={reduce ? UI_REDUCED_MOTION : { ...UI_SPRING, mass: 0.7 }}
              className="flex shrink-0 items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-[11px] font-medium text-success"
            >
              <HugeiconsIcon icon={Tick02Icon} size={12} strokeWidth={2.2} />
              {t("settings.startup.on")}
            </motion.span>
          )}
        </AnimatePresence>
        <Switch
          checked={on}
          disabled={!data || setStartup.isPending}
          onCheckedChange={(enabled) => {
            onToggle?.(enabled);
            setStartup.mutate(enabled);
          }}
          label={t("settings.startup.openAtLogin")}
        />
      </div>
    </div>
  );
}
