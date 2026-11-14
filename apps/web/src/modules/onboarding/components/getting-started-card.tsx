import { ArrowRight02Icon, MinusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AuthorHandleLink } from "@/components/brand/author-handle-link";
import { buttonVariants } from "@/components/ui/action/button";
import { IconAction } from "@/components/ui/action/icon-action";
import { readStorage, writeStorage } from "@/lib/storage";
import { useSetupProgress } from "@/modules/setup/hooks/use-setup-progress";
import { ProgressRing } from "./progress-ring";

interface GettingStartedCardProps {
  organizationId: string;
  onNavigate?: () => void;
}

const EASE = [0.2, 0, 0, 1] as const;

export function GettingStartedCard({ organizationId, onNavigate }: GettingStartedCardProps) {
  const storageKey = `runelay-onboarding-dismissed:${organizationId}`;
  const [dismissed, setDismissed] = useState(() => readStorage(storageKey) === "true");
  const { currentStep, completed, total, finished, loaded } = useSetupProgress(organizationId);
  const visible = loaded && !dismissed && !finished;

  const dismiss = () => {
    setDismissed(true);
    writeStorage(storageKey, "true");
  };

  if (loaded && finished) return <AuthorHandleLink />;

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="overflow-hidden"
        >
          <div className="flex flex-col gap-2.5 rounded-xl bg-card/70 p-3 ring-1 ring-border/60">
            <div className="flex items-center gap-2">
              <ProgressRing value={completed / Math.max(total, 1)} />
              <span className="text-[13px] font-medium">Primeiros passos</span>
              <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">
                {completed}/{total}
              </span>
            </div>

            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={currentStep?.id ?? "loading"}
                initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
                transition={{ duration: 0.3, ease: EASE }}
                className="flex flex-col gap-2.5"
              >
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Próximo passo: {currentStep?.title.toLowerCase()}.
                </p>
                <div className="flex items-center gap-1.5">
                  <Link
                    to="/setup"
                    onClick={onNavigate}
                    data-sound="tap"
                    className={buttonVariants({ size: "sm", className: "flex-1 gap-1.5" })}
                  >
                    <HugeiconsIcon icon={ArrowRight02Icon} size={15} strokeWidth={1.8} />
                    Continuar
                  </Link>
                  <IconAction icon={MinusSignIcon} label="Dispensar" variant="glass" onClick={dismiss} />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
