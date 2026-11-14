import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "motion/react";
import { type ReactNode, useId, useState } from "react";
import { AnimatedHeight } from "@/components/layout/animated-height";
import { cn } from "@/lib/utils";

interface HealthGroupProps {
  label: string;
  count: number;
  tone?: "default" | "warning" | "destructive";
  children: ReactNode;
}

export function HealthGroup({ label, count, tone = "default", children }: HealthGroupProps) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const empty = count === 0;

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={empty}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex min-h-11 items-center gap-2 rounded-lg px-2 text-left text-[13px] transition-colors duration-200 not-disabled:hover:bg-foreground/[0.04] disabled:cursor-default sm:min-h-9"
      >
        <span className="flex-1 font-medium">{label}</span>
        <span
          className={cn(
            "font-semibold tabular-nums",
            empty && "text-muted-foreground",
            !empty && tone === "warning" && "text-warning",
            !empty && tone === "destructive" && "text-destructive",
          )}
        >
          {count}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
          className={cn("flex text-muted-foreground", empty && "opacity-0")}
        >
          <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={1.8} />
        </motion.span>
      </button>
      <AnimatedHeight>
        {open && !empty && (
          <ul id={contentId} className="flex flex-col gap-0.5 pt-0.5 pb-2 pl-2">
            {children}
          </ul>
        )}
      </AnimatedHeight>
    </div>
  );
}
