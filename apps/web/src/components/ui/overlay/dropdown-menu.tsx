import { AnimatePresence, motion } from "motion/react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  collisionPadding?: number;
  onCloseAutoFocus?: (event: Event) => void;
  portalContainer?: HTMLElement | null;
  className?: string;
}

export function DropdownMenu({
  open,
  onOpenChange,
  trigger,
  children,
  align = "end",
  side = "bottom",
  sideOffset = 6,
  collisionPadding = 12,
  onCloseAutoFocus,
  portalContainer,
  className,
}: DropdownMenuProps) {
  return (
    <DropdownMenuPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DropdownMenuPrimitive.Trigger asChild>{trigger}</DropdownMenuPrimitive.Trigger>

      <AnimatePresence>
        {open && (
          <DropdownMenuPrimitive.Portal container={portalContainer} forceMount>
            <DropdownMenuPrimitive.Content
              asChild
              align={align}
              side={side}
              sideOffset={sideOffset}
              collisionPadding={collisionPadding}
              onCloseAutoFocus={onCloseAutoFocus}
            >
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 32,
                  mass: 0.7,
                }}
                style={{
                  transformOrigin: "var(--radix-dropdown-menu-content-transform-origin)",
                }}
                className={cn(
                  "z-50 max-w-[calc(100vw-24px)] rounded-xl border border-foreground/10 bg-popover p-1.5 text-popover-foreground shadow-xl dark:shadow-black/50",
                  className,
                )}
              >
                {children}
              </motion.div>
            </DropdownMenuPrimitive.Content>
          </DropdownMenuPrimitive.Portal>
        )}
      </AnimatePresence>
    </DropdownMenuPrimitive.Root>
  );
}
