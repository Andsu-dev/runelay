import { AnimatePresence, motion } from "motion/react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { createContext, type ReactNode, type RefObject, use, useRef } from "react";
import { cn } from "@/lib/utils";

interface PopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: ReactNode;
  anchorRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  collisionPadding?: number;
  avoidCollisions?: boolean;
  portalContainer?: HTMLElement | null;
  modal?: boolean;
  fitViewport?: boolean;
  className?: string;
  onContentPointerEnter?: () => void;
  onContentPointerLeave?: () => void;
}

const FitViewportContext = createContext(false);

export function Popover({
  open,
  onOpenChange,
  trigger,
  anchorRef,
  children,
  align = "start",
  side = "bottom",
  sideOffset = 6,
  collisionPadding = 12,
  avoidCollisions = true,
  portalContainer,
  modal = false,
  fitViewport,
  className,
  onContentPointerEnter,
  onContentPointerLeave,
}: PopoverProps) {
  const inherited = use(FitViewportContext);
  const fit = fitViewport ?? inherited;
  const ownTriggerRef = useRef<HTMLButtonElement>(null);
  const triggerRef = anchorRef ?? ownTriggerRef;
  const keyboardRef = useRef(false);
  const insideRef = useRef(false);

  const dismissOnOutside = (node: HTMLDivElement | null) => {
    if (!node) return;
    const dismiss = ({ target }: PointerEvent) => {
      const inside = insideRef.current;
      insideRef.current = false;
      if (inside || !(target instanceof Node)) return;
      if (node.contains(target) || triggerRef.current?.contains(target)) return;
      const nestedOpen = Array.from(document.querySelectorAll("[data-radix-popper-content-wrapper]")).some(
        (wrapper) =>
          !wrapper.contains(node) && node.compareDocumentPosition(wrapper) & Node.DOCUMENT_POSITION_FOLLOWING,
      );
      if (nestedOpen) return;
      if (target instanceof Element && target.closest("[data-radix-popper-content-wrapper]")) return;
      onOpenChange(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  };

  const restoreFocus = (event: Event) => {
    event.preventDefault();
    const keyboard = keyboardRef.current;
    keyboardRef.current = false;
    const { activeElement, body } = document;
    if (activeElement && activeElement !== body) return;
    triggerRef.current?.focus({ focusVisible: keyboard });
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange} modal={modal}>
      {anchorRef ? (
        <PopoverPrimitive.Anchor virtualRef={anchorRef as RefObject<HTMLElement>} />
      ) : (
        <PopoverPrimitive.Trigger ref={ownTriggerRef} asChild>
          {trigger}
        </PopoverPrimitive.Trigger>
      )}

      <AnimatePresence>
        {open && (
          <PopoverPrimitive.Portal container={portalContainer} forceMount>
            <PopoverPrimitive.Content
              asChild
              align={align}
              side={side}
              sideOffset={sideOffset}
              collisionPadding={collisionPadding}
              avoidCollisions={avoidCollisions}
              onCloseAutoFocus={restoreFocus}
              onPointerDownOutside={(event) => event.preventDefault()}
            >
              <motion.div
                ref={dismissOnOutside}
                onClick={(event) => event.stopPropagation()}
                onPointerDownCapture={() => {
                  insideRef.current = true;
                }}
                onKeyDown={() => {
                  keyboardRef.current = true;
                }}
                onPointerDown={() => {
                  keyboardRef.current = false;
                }}
                onPointerEnter={onContentPointerEnter}
                onPointerLeave={onContentPointerLeave}
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
                  transformOrigin: "var(--radix-popover-content-transform-origin)",
                }}
                className={cn(
                  "z-50 max-w-[calc(100vw-24px)] rounded-xl border border-border/60 bg-popover p-1.5 text-popover-foreground shadow-xl",
                  fit && "max-h-(--radix-popover-content-available-height) overflow-y-auto overscroll-contain",
                  className,
                )}
              >
                <FitViewportContext value={fit}>{children}</FitViewportContext>
              </motion.div>
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        )}
      </AnimatePresence>
    </PopoverPrimitive.Root>
  );
}

interface AnchoredPopoverProps {
  open: boolean;
  anchor: ReactNode;
  children: ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  onEscapeKeyDown?: () => void;
  className?: string;
}

export function AnchoredPopover({
  open,
  anchor,
  children,
  align = "end",
  side = "top",
  sideOffset = 12,
  onEscapeKeyDown,
  className,
}: AnchoredPopoverProps) {
  return (
    <PopoverPrimitive.Root open={open}>
      <PopoverPrimitive.Anchor asChild>{anchor}</PopoverPrimitive.Anchor>

      <AnimatePresence>
        {open && (
          <PopoverPrimitive.Portal forceMount>
            <PopoverPrimitive.Content
              asChild
              align={align}
              side={side}
              sideOffset={sideOffset}
              onOpenAutoFocus={(event) => event.preventDefault()}
              onInteractOutside={(event) => event.preventDefault()}
              onEscapeKeyDown={onEscapeKeyDown}
            >
              <motion.div
                onClick={(event) => event.stopPropagation()}
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 32,
                  mass: 0.7,
                }}
                style={{
                  transformOrigin: "var(--radix-popover-content-transform-origin)",
                }}
                className={cn(
                  "z-50 max-w-[calc(100vw-24px)] border border-border/60 bg-popover text-popover-foreground shadow-xl",
                  className,
                )}
              >
                {children}
              </motion.div>
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        )}
      </AnimatePresence>
    </PopoverPrimitive.Root>
  );
}
