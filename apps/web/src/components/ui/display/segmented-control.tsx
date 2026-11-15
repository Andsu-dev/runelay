import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { motion, useReducedMotion } from "motion/react";
import { type ReactNode, useId } from "react";
import { cn } from "@/lib/utils";
import { segmentedPill, segmentedTextActive, segmentedTextIdle, segmentedTrack } from "./segmented";
import { UI_REDUCED_MOTION, UI_SPRING } from "./spring";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: IconSvgElement;
  leading?: ReactNode;
  ariaLabel?: string;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: SegmentedControlProps<T>) {
  const transition = useReducedMotion() ? UI_REDUCED_MOTION : UI_SPRING;
  const layoutId = `segmented-${useId()}`;

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "no-scrollbar flex min-h-11 w-fit max-w-full items-stretch gap-0.5 overflow-x-auto sm:min-h-9",
        segmentedTrack,
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={option.ariaLabel}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex shrink-0 items-center whitespace-nowrap rounded-md px-3 text-[13px] font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-inset",
              selected ? segmentedTextActive : segmentedTextIdle,
            )}
          >
            {selected && (
              <motion.span
                layoutId={layoutId}
                layoutDependency={value}
                className={cn("absolute inset-0", segmentedPill)}
                transition={transition}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {option.icon && <HugeiconsIcon icon={option.icon} size={15} strokeWidth={1.6} className="shrink-0" />}
              {option.leading}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
