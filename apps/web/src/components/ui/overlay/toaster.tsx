import { Alert02Icon, CheckmarkCircle02Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "motion/react";
import { UI_SPRING } from "@/components/ui/display/spring";
import { dismissToast, type ToastTone, useToasts } from "@/lib/toast";
import { cn } from "@/lib/utils";

const TONE_ICON = {
  success: { icon: CheckmarkCircle02Icon, className: "text-success" },
  info: { icon: InformationCircleIcon, className: undefined },
  error: { icon: Alert02Icon, className: "text-destructive" },
} satisfies Record<ToastTone, unknown>;

export function Toaster() {
  const toasts = useToasts();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <AnimatePresence initial={false}>
        {toasts.map((item) => (
          <motion.button
            type="button"
            key={item.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={UI_SPRING}
            role={item.tone === "error" ? "alert" : "status"}
            onClick={() => dismissToast(item.id)}
            className="pointer-events-auto flex max-w-md items-center gap-2.5 rounded-xl bg-foreground px-4 py-3 text-left text-[13px] font-medium text-background shadow-lg"
          >
            <HugeiconsIcon
              icon={TONE_ICON[item.tone].icon}
              size={18}
              strokeWidth={1.8}
              className={cn("shrink-0", TONE_ICON[item.tone].className)}
            />
            {item.message}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
