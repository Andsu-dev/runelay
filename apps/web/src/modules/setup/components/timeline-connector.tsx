import { motion } from "motion/react";
import { TIMELINE_EASE } from "@/modules/setup/constants/setup.constants";

interface TimelineConnectorProps {
  filled: boolean;
}

export function TimelineConnector({ filled }: TimelineConnectorProps) {
  return (
    <span aria-hidden className="absolute top-7 -bottom-1 left-1/2 w-px -translate-x-1/2 overflow-hidden bg-border">
      <motion.span
        initial={false}
        animate={{ scaleY: filled ? 1 : 0 }}
        transition={{ duration: 0.7, ease: TIMELINE_EASE }}
        className="absolute inset-0 origin-top bg-foreground"
      />
    </span>
  );
}
