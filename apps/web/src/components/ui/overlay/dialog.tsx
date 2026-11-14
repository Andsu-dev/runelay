import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { AnimatePresence, motion } from "motion/react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { KeyboardEvent, ReactNode } from "react";
import { cue } from "@/lib/sound";
import { cn } from "@/lib/utils";

const playOpenCue = (node: HTMLDivElement | null) => {
  if (node) cue("open");
};

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  icon?: IconSvgElement;
  children: ReactNode;
  footer?: ReactNode;
  trigger?: ReactNode;
  hideHeader?: boolean;
  hideClose?: boolean;
  contentClassName?: string;
  bodyClassName?: string;
  overlayClassName?: string;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  onOpenAutoFocus?: (event: Event) => void;
}

export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  icon,
  children,
  footer,
  trigger,
  hideHeader = false,
  hideClose = false,
  contentClassName,
  bodyClassName,
  overlayClassName,
  onKeyDown,
  onOpenAutoFocus,
}: DialogProps) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) cue("close");
        onOpenChange(next);
      }}
    >
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}

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
                className={cn("fixed inset-0 z-50 bg-foreground/35 backdrop-blur-[2px]", overlayClassName)}
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild onOpenAutoFocus={onOpenAutoFocus}>
              <motion.div
                ref={playOpenCue}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={onKeyDown}
                initial={{ opacity: 0, y: 14, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{
                  type: "spring",
                  stiffness: 430,
                  damping: 34,
                  mass: 0.7,
                }}
                className={cn(
                  "fixed inset-x-2 bottom-2 z-50 flex max-h-[calc(100dvh-1rem)] flex-col gap-4 rounded-xl border border-border bg-card p-5 text-foreground shadow-xl outline-none sm:max-h-[calc(100dvh-3rem)]",
                  "pb-[max(1.25rem,env(safe-area-inset-bottom))]",
                  "sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:pb-5",
                  contentClassName,
                )}
              >
                <div
                  className={cn(
                    "flex shrink-0 items-start justify-between gap-4",
                    hideHeader && "justify-end",
                    hideHeader && !hideClose && "-mb-2",
                    hideHeader && hideClose && "sr-only",
                  )}
                >
                  {title === undefined ? null : (
                    <div className={cn("flex min-w-0 items-start gap-3", hideHeader && "sr-only")}>
                      {icon && (
                        <span
                          aria-hidden
                          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                        >
                          <HugeiconsIcon icon={icon} size={18} strokeWidth={1.5} />
                        </span>
                      )}
                      <div className="flex min-w-0 flex-col gap-1">
                        <DialogPrimitive.Title className="text-[15px] font-semibold">{title}</DialogPrimitive.Title>
                        <DialogPrimitive.Description className="text-[13px] text-muted-foreground">
                          {description}
                        </DialogPrimitive.Description>
                      </div>
                    </div>
                  )}

                  <DialogPrimitive.Close
                    aria-label="Fechar"
                    hidden={hideClose}
                    className="-mt-1 -mr-1 flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30 sm:size-8 sm:min-h-0 sm:min-w-0"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
                  </DialogPrimitive.Close>
                </div>

                <div
                  className={cn(
                    "-mx-5 -mt-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-5 pt-1",
                    footer ? "-mb-1 pb-1" : "-mb-5 pb-5",
                    bodyClassName,
                  )}
                >
                  {children}
                </div>
                {footer && <div className="shrink-0">{footer}</div>}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
