import { useCallback } from "react";
import { animateSlotText, buildSlotText } from "slot-text";
import { cn } from "@/lib/utils";

interface RollingTextProps {
  value: string;
  className?: string;
}

const ROLL = {
  direction: "up",
  duration: 700,
  stagger: 40,
  exitOffset: 0,
  bounce: 0.12,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;
const ENTRANCE_DELAY_MS = 120;

const zeroed = (value: string) => value.replace(/\d/g, "0");

export function RollingText({ value, className }: RollingTextProps) {
  const roll = useCallback(
    (element: HTMLSpanElement | null) => {
      if (!element) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        buildSlotText(element, value);
        return;
      }
      const entering = !element.dataset.rolled;
      if (entering && !element.textContent) buildSlotText(element, zeroed(value));
      const timer = window.setTimeout(
        () => {
          element.dataset.rolled = "true";
          animateSlotText(element, value, ROLL);
        },
        entering ? ENTRANCE_DELAY_MS : 0,
      );
      return () => window.clearTimeout(timer);
    },
    [value],
  );

  return <span ref={roll} aria-label={value} className={cn("inline-block tabular-nums", className)} />;
}
