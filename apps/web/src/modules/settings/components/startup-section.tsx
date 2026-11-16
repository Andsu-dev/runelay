import { PowerServiceIcon } from "@hugeicons/core-free-icons";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import { UI_REDUCED_MOTION, UI_SPRING } from "@/components/ui/display/spring";
import { useT } from "@/lib/i18n";
import { desktopStartupQuery } from "@/modules/settings/api/desktop-startup.api";
import type { RunelayDesktopBridge } from "@/types/runelay-desktop";
import { SettingsSection } from "./settings-section";
import { StartupCard } from "./startup-card";

interface StartupSectionProps {
  bridge: RunelayDesktopBridge;
}

export function StartupSection({ bridge }: StartupSectionProps) {
  const t = useT();
  const reducedMotion = useReducedMotion();
  const { data } = useQuery(desktopStartupQuery(bridge));

  if (!data?.supported) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? UI_REDUCED_MOTION : UI_SPRING}
    >
      <SettingsSection icon={PowerServiceIcon} title={t("settings.startup.title")}>
        <StartupCard bridge={bridge} />
      </SettingsSection>
    </motion.div>
  );
}
