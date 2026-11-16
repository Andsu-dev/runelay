import { PowerServiceIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "motion/react";
import { LogoMark } from "@/components/brand/logo-mark";
import { UI_REDUCED_MOTION, UI_SPRING } from "@/components/ui/display/spring";
import {
  STARTUP_POWER_FRAMES,
  STARTUP_SCREEN_OFF_FRAMES,
  STARTUP_TRAY_FRAMES,
} from "@/modules/settings/constants/settings.constants";
import { useStartupLoop } from "@/modules/settings/hooks/use-startup-loop";

interface StartupScreenProps {
  on: boolean;
  reduce: boolean;
}

export function StartupScreen({ on, reduce }: StartupScreenProps) {
  const swap = reduce ? UI_REDUCED_MOTION : UI_SPRING;
  const trayLoop = useStartupLoop(STARTUP_TRAY_FRAMES, reduce);
  const offLoop = useStartupLoop(STARTUP_SCREEN_OFF_FRAMES, reduce);
  const powerLoop = useStartupLoop(STARTUP_POWER_FRAMES, reduce);

  return (
    <div className="flex h-24 w-32 shrink-0 flex-col items-center">
      <div className="relative h-21 w-full overflow-hidden rounded-md bg-background shadow-sm dark:ring-1 dark:ring-foreground/15">
        <div className="flex h-5 items-center gap-1 bg-muted px-2">
          <span className="size-1 rounded-full bg-muted-foreground/40" />
          <span className="size-1 rounded-full bg-muted-foreground/40" />
          <span className="size-1 rounded-full bg-muted-foreground/40" />
          <span className="ml-auto h-1 w-3.5 rounded-full bg-muted-foreground/30" />
          <span className="relative size-3.5 rounded-sm bg-foreground/8">
            <motion.span
              initial={false}
              animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 0.7 }}
              transition={swap}
              className="absolute inset-0"
            >
              <span
                ref={trayLoop}
                className="flex size-full items-center justify-center rounded-sm bg-app-icon shadow-xs"
              >
                <LogoMark className="size-2.5" />
              </span>
            </motion.span>
          </span>
        </div>
        <div className="flex flex-col gap-1.5 p-2.5">
          <span className="h-1.5 w-14 rounded-full bg-muted" />
          <span className="h-1.5 w-9 rounded-full bg-muted" />
        </div>
        {!reduce && (
          <div
            ref={offLoop}
            className="absolute inset-0 flex items-center justify-center bg-app-icon text-silver-to opacity-0"
          >
            <span ref={powerLoop} className="flex">
              <HugeiconsIcon icon={PowerServiceIcon} size={18} strokeWidth={1.8} />
            </span>
          </div>
        )}
      </div>
      <span className="h-2 w-5 bg-muted-foreground/25 dark:bg-muted-foreground/45" />
      <span className="h-1 w-12 rounded-full bg-muted-foreground/25 dark:bg-muted-foreground/45" />
    </div>
  );
}
