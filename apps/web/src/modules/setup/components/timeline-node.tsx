import { Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "motion/react";
import { UI_SPRING } from "@/components/ui/display/spring";
import { cn } from "@/lib/utils";

interface TimelineNodeProps {
  index: number;
  done: boolean;
  active: boolean;
  reachable: boolean;
}

export function TimelineNode({ index, done, active, reachable }: TimelineNodeProps) {
  const state = done ? "done" : active ? "active" : "idle";

  return (
    <motion.span
      layout
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ ...UI_SPRING, delay: index * 0.06 }}
      className={cn(
        "relative z-10 flex size-7 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums transition-[background-color,color,box-shadow] duration-300",
        done && "bg-foreground text-background shadow-sm",
        !done &&
          active &&
          "bg-background text-foreground shadow-[0_0_0_1px_var(--foreground),0_0_0_5px_color-mix(in_oklch,var(--foreground)_8%,transparent)]",
        !done && !active && "bg-panel text-muted-foreground ring-1 ring-border",
        !reachable && "opacity-60",
      )}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={state}
          initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={UI_SPRING}
          className="flex"
        >
          {done ? <HugeiconsIcon icon={Tick02Icon} size={13} strokeWidth={2.4} /> : index}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}
