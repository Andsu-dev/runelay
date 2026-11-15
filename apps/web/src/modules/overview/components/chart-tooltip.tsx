import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { UI_SPRING } from "@/components/ui/display/spring";

interface ChartTooltipProps {
  anchor: { x: number; y: number } | null;
  children: ReactNode;
}

export function ChartTooltip({ anchor, children }: ChartTooltipProps) {
  return (
    <AnimatePresence>
      {anchor && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0, left: `${anchor.x * 100}%`, bottom: `${anchor.y * 100}%` }}
          animate={{ opacity: 1, left: `${anchor.x * 100}%`, bottom: `${anchor.y * 100}%` }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
          transition={UI_SPRING}
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-2 whitespace-nowrap rounded-md bg-foreground px-2.5 py-2 text-xs text-background shadow-md"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
