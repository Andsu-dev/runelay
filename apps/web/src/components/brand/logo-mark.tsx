import { motion } from "motion/react";
import { useId } from "react";
import { UI_SPRING } from "@/components/ui/display/spring";
import { cn } from "@/lib/utils";

interface LogoMarkProps {
  className?: string;
  split?: boolean;
  entrance?: boolean;
}

const HALF_OFFSET = 28;

export function LogoMark({ className, split = false, entrance = false }: LogoMarkProps) {
  const gradientId = useId();
  const offset = split ? HALF_OFFSET : 0;

  return (
    <svg viewBox="226 216 572 592" aria-hidden className={cn("shrink-0 overflow-visible", className)}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--silver-from)" />
          <stop offset="1" stopColor="var(--silver-to)" />
        </linearGradient>
      </defs>
      <motion.path
        d="M492 285A256 256 0 0 0 492 797Z"
        fill={`url(#${gradientId})`}
        initial={entrance ? { y: 120, opacity: 0 } : false}
        animate={{ y: offset, opacity: 1 }}
        transition={UI_SPRING}
      />
      <motion.path
        d="M532 226A256 256 0 0 1 532 738Z"
        fill={`url(#${gradientId})`}
        initial={entrance ? { y: -120, opacity: 0 } : false}
        animate={{ y: -offset, opacity: 1 }}
        transition={UI_SPRING}
      />
    </svg>
  );
}
