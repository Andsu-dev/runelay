import { Loading03Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { SourceView } from "@runeley/shared";
import { AnimatePresence, motion } from "motion/react";
import { UI_SPRING } from "@/components/ui/display/spring";
import { cn } from "@/lib/utils";
import { ConnectorIcon } from "@/modules/catalog/components/connector-icon";
import { RECONNECT_ROW_LABEL, type ReconnectRowState } from "@/modules/reconnect/constants/reconnect.constants";

interface ReconnectRowProps {
  source: SourceView;
  state: ReconnectRowState;
}

export function ReconnectRow({ source, state }: ReconnectRowProps) {
  const done = state === "connected";
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl bg-card px-4 py-3 shadow-xs transition-opacity duration-200",
        (state === "skipped" || state === "queued") && "opacity-60",
      )}
    >
      <ConnectorIcon name={source.name} icon={source.icon} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold">{source.name}</span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={state}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={UI_SPRING}
            className={cn("truncate text-xs", done ? "text-success" : "text-muted-foreground")}
          >
            {RECONNECT_ROW_LABEL[state]}
          </motion.span>
        </AnimatePresence>
      </div>
      <AnimatePresence initial={false}>
        {done && (
          <motion.span
            key="done"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...UI_SPRING, mass: 0.7 }}
            className="flex size-7 items-center justify-center rounded-full bg-success/12 text-success"
          >
            <HugeiconsIcon icon={Tick02Icon} size={16} strokeWidth={2} />
          </motion.span>
        )}
        {state === "waiting" && (
          <motion.span key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <HugeiconsIcon
              icon={Loading03Icon}
              size={16}
              className="animate-spin text-muted-foreground motion-reduce:animate-none"
            />
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
