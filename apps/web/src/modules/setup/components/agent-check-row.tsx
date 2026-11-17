import { Alert02Icon, Loading03Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { UI_REDUCED_MOTION, UI_SPRING } from "@/components/ui/display/spring";
import { cn } from "@/lib/utils";

export type AgentCheckState = "pending" | "ok" | "warn";

interface AgentCheckRowProps {
  leading: ReactNode;
  title: string;
  detail?: string | null;
  state: AgentCheckState;
  stateLabel: string;
  action?: ReactNode;
}

const STATE_ICONS = { pending: Loading03Icon, ok: Tick02Icon, warn: Alert02Icon } as const;

export function AgentCheckRow({ leading, title, detail, state, stateLabel, action }: AgentCheckRowProps) {
  const reduce = useReducedMotion();
  const spring = reduce ? UI_REDUCED_MOTION : UI_SPRING;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
      transition={spring}
      className="flex min-h-12 items-center gap-3 rounded-lg bg-muted/60 px-3 py-2 dark:bg-muted/40"
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-background/70">{leading}</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[13px] font-medium text-pretty">{title}</span>
        {detail && <span className="text-[12px] text-pretty text-muted-foreground">{detail}</span>}
      </span>
      {action}
      <span
        role="img"
        aria-label={stateLabel}
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full",
          state === "ok" && "bg-success/12 text-success",
          state === "warn" && "bg-warning/14 text-warning",
          state === "pending" && "text-muted-foreground",
        )}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={state}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={spring}
            className="flex"
          >
            <HugeiconsIcon
              icon={STATE_ICONS[state]}
              size={13}
              strokeWidth={2.2}
              className={cn(state === "pending" && "animate-spin")}
            />
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.li>
  );
}
