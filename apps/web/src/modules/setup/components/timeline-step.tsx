import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/action/button";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { TIMELINE_EASE } from "@/modules/setup/constants/setup.constants";
import type { SetupStepState } from "@/modules/setup/types/setup.types";
import { TimelineConnector } from "./timeline-connector";
import { TimelineNode } from "./timeline-node";

interface TimelineStepProps {
  step: SetupStepState;
  open: boolean;
  last: boolean;
  onToggle: () => void;
  onComplete: () => void;
  body?: ReactNode;
  action?: ReactNode;
}

export function TimelineStep({ step, open, last, onToggle, onComplete, body, action }: TimelineStepProps) {
  const t = useT();

  return (
    <motion.li
      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={{ opacity: step.reachable ? 1 : 0.55, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, ease: TIMELINE_EASE, delay: step.index * 0.08 }}
      className="relative grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-4"
    >
      <div className="relative flex justify-center">
        <TimelineNode index={step.index} done={step.done} active={open} reachable={step.reachable} />
        {!last && <TimelineConnector filled={step.done} />}
      </div>

      <div className={cn("flex min-w-0 flex-col", last ? "pb-2" : "pb-9")}>
        <button
          type="button"
          onClick={onToggle}
          disabled={!step.reachable}
          aria-expanded={open}
          className="group -mx-1.5 flex min-h-7 items-center gap-2 rounded-md px-1.5 text-left outline-none transition-colors duration-200 focus-visible:bg-foreground/5 disabled:cursor-not-allowed"
        >
          <span
            className={cn(
              "text-sm font-semibold transition-colors duration-200",
              step.done && !open ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {t(step.title)}
          </span>
          {step.reachable && (
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              size={14}
              strokeWidth={1.8}
              className={cn(
                "text-muted-foreground opacity-0 transition-[opacity,rotate] duration-200 group-hover:opacity-100 [@media(hover:none)]:opacity-100",
                open && "rotate-180 opacity-100",
              )}
            />
          )}
          {step.done && !open && <span className="ml-auto text-xs text-muted-foreground">{t(step.doneSummary)}</span>}
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="body"
              initial={{ opacity: 0, height: 0, filter: "blur(6px)" }}
              animate={{ opacity: 1, height: "auto", filter: "blur(0px)" }}
              exit={{ opacity: 0, height: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.45, ease: TIMELINE_EASE }}
              className="overflow-hidden"
            >
              <motion.div
                initial={{ y: 8 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.45, ease: TIMELINE_EASE }}
                className="flex flex-col gap-4 pt-1.5"
              >
                <p className="max-w-prose text-[13px] text-pretty text-muted-foreground">{t(step.description)}</p>
                {body}
                <div className="flex flex-wrap items-center gap-2">
                  {action}
                  {!step.done && (
                    <Button variant="ghost" size="sm" onClick={onComplete}>
                      {t("setup.markDone")}
                    </Button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.li>
  );
}
