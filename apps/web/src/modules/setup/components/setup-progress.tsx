import { motion } from "motion/react";
import { useT } from "@/lib/i18n";
import { TIMELINE_EASE } from "@/modules/setup/constants/setup.constants";

interface SetupProgressProps {
  completed: number;
  total: number;
}

export function SetupProgress({ completed, total }: SetupProgressProps) {
  const t = useT();

  return (
    <div className="flex items-center gap-3">
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-foreground/8">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(completed / Math.max(total, 1)) * 100}%` }}
          transition={{ duration: 0.8, ease: TIMELINE_EASE }}
          className="h-full rounded-full bg-foreground"
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">{t("setup.progress", { completed, total })}</span>
    </div>
  );
}
