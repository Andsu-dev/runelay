import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "motion/react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { ReactNode } from "react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  side?: "left" | "right";
  hideHeader?: boolean;
  contentClassName?: string;
}

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  side = "right",
  hideHeader = false,
  contentClassName,
}: SheetProps) {
  const t = useT();
  const offscreen = side === "left" ? "-100%" : "100%";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild>
              <motion.div
                onClick={(event) => event.stopPropagation()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="fixed inset-0 z-50 bg-foreground/35 backdrop-blur-[2px]"
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild {...(description ? {} : { "aria-describedby": undefined })}>
              <motion.div
                onClick={(event) => event.stopPropagation()}
                initial={{ x: offscreen }}
                animate={{ x: 0 }}
                exit={{ x: offscreen }}
                transition={{ type: "spring", stiffness: 420, damping: 38, mass: 0.8 }}
                className={cn(
                  "fixed inset-y-0 z-50 flex w-[min(20rem,calc(100vw-3rem))] flex-col bg-sidebar text-foreground shadow-xl outline-none",
                  "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
                  side === "left" ? "left-0" : "right-0",
                  contentClassName,
                )}
              >
                <div className={cn("flex items-start gap-3 px-4 pt-4 pb-2", hideHeader && "sr-only")}>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <DialogPrimitive.Title className="truncate text-[15px] font-semibold">
                      {title}
                    </DialogPrimitive.Title>
                    {description && (
                      <DialogPrimitive.Description className="text-[13px] text-muted-foreground">
                        {description}
                      </DialogPrimitive.Description>
                    )}
                  </div>
                  <DialogPrimitive.Close className="-mr-1 flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground pressable hover:bg-muted/60 hover:text-foreground">
                    <HugeiconsIcon icon={Cancel01Icon} size={16} />
                    <span className="sr-only">{t("common.actions.close")}</span>
                  </DialogPrimitive.Close>
                </div>
                <div className="flex min-h-0 flex-1 flex-col">{children}</div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
