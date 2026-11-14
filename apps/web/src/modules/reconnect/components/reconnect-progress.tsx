import { motion } from "motion/react";
import { UI_SPRING } from "@/components/ui/display/spring";

interface ReconnectProgressProps {
  done: number;
  total: number;
}

export function ReconnectProgress({ done, total }: ReconnectProgressProps) {
  const ratio = total ? done / total : 1;
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-success"
          initial={false}
          animate={{ width: `${ratio * 100}%` }}
          transition={UI_SPRING}
        />
      </div>
      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
        {done} de {total}
      </span>
    </div>
  );
}
