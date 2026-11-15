import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { createPortal } from "react-dom";
import { LogoMark } from "@/components/brand/logo-mark";
import { UI_REDUCED_MOTION, UI_SPRING } from "@/components/ui/display/spring";
import { usePageTransitionActive } from "@/lib/page-transition";
import { cn } from "@/lib/utils";

const ENTER = { duration: 0.15, ease: [0.2, 0, 0, 1] } as const;
const REDUCED_ENTER = { duration: 0.07 } as const;
const PULSE = { duration: 0.9, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" } as const;

export function PageTransitionOverlay() {
  const active = usePageTransitionActive();
  const reducedMotion = useReducedMotion();

  return createPortal(
    <AnimatePresence>
      {active && (
        <motion.div
          key="page-transition"
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: reducedMotion ? REDUCED_ENTER : ENTER }}
          exit={{ opacity: 0, transition: reducedMotion ? UI_REDUCED_MOTION : UI_SPRING }}
          className={cn(
            "fixed inset-0 z-[2147483647] flex items-center justify-center",
            reducedMotion ? "bg-background" : "bg-background/70 backdrop-blur-md",
          )}
        >
          {!reducedMotion && (
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: [0.96, 1.04, 0.96], opacity: [0.75, 1, 0.75] }}
              transition={PULSE}
            >
              <LogoMark className="size-9" />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
