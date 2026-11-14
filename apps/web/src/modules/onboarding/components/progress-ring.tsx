import { motion } from "motion/react";

interface ProgressRingProps {
  value: number;
}

const RADIUS = 7;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProgressRing({ value }: ProgressRingProps) {
  return (
    <svg viewBox="0 0 18 18" aria-hidden className="size-[18px] shrink-0 -rotate-90">
      <circle cx="9" cy="9" r={RADIUS} fill="none" strokeWidth="2" className="stroke-foreground/12" />
      <motion.circle
        cx="9"
        cy="9"
        r={RADIUS}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        initial={false}
        animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - value) }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="stroke-foreground"
      />
    </svg>
  );
}
