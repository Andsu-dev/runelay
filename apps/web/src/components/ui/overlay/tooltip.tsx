import { AnimatePresence, motion } from "motion/react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { type ComponentProps, type ReactNode, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps
  extends Omit<ComponentProps<typeof TooltipPrimitive.Trigger>, "content" | "children" | "asChild"> {
  content: ReactNode;
  children: ReactNode;
  contentClassName?: string;
  openOnTap?: boolean;
  hideArrow?: boolean;
  side?: ComponentProps<typeof TooltipPrimitive.Content>["side"];
}

export function Tooltip({
  content,
  children,
  contentClassName,
  openOnTap = false,
  hideArrow = false,
  side = "top",
  ...trigger
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const hovered = useRef(false);

  const changeOpen = (next: boolean) => {
    const focusVisible = document.activeElement?.matches(":focus-visible");
    if (next && !hovered.current && !focusVisible) return;
    setOpen(next);
  };

  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root open={open} onOpenChange={changeOpen}>
        <TooltipPrimitive.Trigger
          asChild
          {...trigger}
          onPointerEnter={(event) => {
            hovered.current = true;
            trigger.onPointerEnter?.(event);
          }}
          onPointerLeave={(event) => {
            hovered.current = false;
            trigger.onPointerLeave?.(event);
          }}
          onClick={(event) => {
            trigger.onClick?.(event);
            if (!openOnTap) return;
            event.preventDefault();
            setOpen(true);
          }}
        >
          {children}
        </TooltipPrimitive.Trigger>

        <AnimatePresence>
          {open && (
            <TooltipPrimitive.Portal forceMount>
              <TooltipPrimitive.Content asChild side={side} sideOffset={6}>
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 2, scale: 0.98 }}
                  transition={{
                    type: "spring",
                    stiffness: 480,
                    damping: 32,
                    mass: 0.6,
                  }}
                  style={{
                    transformOrigin: "var(--radix-tooltip-content-transform-origin)",
                  }}
                  className={cn(
                    "z-50 max-w-[min(20rem,calc(100vw-2rem))] whitespace-normal break-words text-pretty rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-md",
                    contentClassName,
                  )}
                >
                  {content}
                  {!hideArrow && <TooltipPrimitive.Arrow className="fill-foreground" />}
                </motion.div>
              </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
          )}
        </AnimatePresence>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
