import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/action/button";
import { UI_REDUCED_MOTION, UI_SPRING } from "@/components/ui/display/spring";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { DESKTOP_ERROR_MESSAGES } from "@/modules/setup/constants/setup.constants";
import type { DesktopSetupFailure } from "@/modules/setup/hooks/use-agent-setup";

interface SetupErrorNoticeProps {
  error: DesktopSetupFailure;
  onRetry: () => void;
}

export function SetupErrorNotice({ error, onRetry }: SetupErrorNoticeProps) {
  const t = useT();
  const reduce = useReducedMotion();
  const spring = reduce ? UI_REDUCED_MOTION : UI_SPRING;
  const detailsId = useId();
  const [open, setOpen] = useState(false);
  const messageKey = (error.code && DESKTOP_ERROR_MESSAGES[error.code]) || "setup.desktop.errors.generic";

  return (
    <div role="alert" className="flex flex-col gap-1.5 text-[13px] text-pretty">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-destructive">{t(messageKey)}</span>
        <Button variant="ghost" size="sm" className="cursor-pointer" onClick={onRetry}>
          {t("setup.desktop.retry")}
        </Button>
        {error.message && (
          <Button
            variant="ghost"
            size="sm"
            className="cursor-pointer"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-controls={detailsId}
          >
            {t("setup.desktop.errors.details")}
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              strokeWidth={1.8}
              className={cn("transition-transform duration-200", open && "rotate-180")}
            />
          </Button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {open && error.message && (
          <motion.div
            key="details"
            id={detailsId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring}
            className="overflow-hidden"
          >
            <pre className="rounded-lg bg-muted/60 p-3 font-mono text-[12px] break-words whitespace-pre-wrap text-muted-foreground dark:bg-muted/40">
              {error.message}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
