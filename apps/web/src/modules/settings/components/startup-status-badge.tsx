import { motion } from "motion/react";
import { UI_REDUCED_MOTION, UI_SPRING } from "@/components/ui/display/spring";
import { cn } from "@/lib/utils";
import { STARTUP_OFFLINE_FRAMES, STARTUP_ONLINE_FRAMES } from "@/modules/settings/constants/settings.constants";
import { useStartupLoop } from "@/modules/settings/hooks/use-startup-loop";

interface StartupStatusBadgeProps {
  visible: boolean;
  online: boolean;
  label: string;
  reduce: boolean;
}

export function StartupStatusBadge({ visible, online, label, reduce }: StartupStatusBadgeProps) {
  const loop = useStartupLoop(online ? STARTUP_ONLINE_FRAMES : STARTUP_OFFLINE_FRAMES, reduce);

  return (
    <motion.span
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={reduce ? UI_REDUCED_MOTION : UI_SPRING}
      className="absolute inset-0 flex items-center justify-center"
    >
      <span
        ref={loop}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
          online ? "bg-success/12 text-success" : "bg-foreground/5 text-muted-foreground",
        )}
      >
        <span className={cn("size-1.5 rounded-full", online ? "bg-success" : "bg-muted-foreground/50")} />
        {label}
      </span>
    </motion.span>
  );
}
