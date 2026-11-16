import { motion } from "motion/react";
import { UI_REDUCED_MOTION, UI_SPRING } from "@/components/ui/display/spring";
import { STARTUP_AGENT_ROWS, STARTUP_LINKS } from "@/modules/settings/constants/settings.constants";
import { StartupLink } from "./startup-link";

interface StartupLinksProps {
  on: boolean;
  reduce: boolean;
}

const ORIGIN_Y = 10;

const linkPath = (y: number) => `M0 ${ORIGIN_Y} C26 ${ORIGIN_Y} 22 ${y} 48 ${y}`;

export function StartupLinks({ on, reduce }: StartupLinksProps) {
  return (
    <svg viewBox="0 0 48 96" aria-hidden className="h-24 w-12 shrink-0 overflow-visible" fill="none">
      {STARTUP_AGENT_ROWS.map((y) => (
        <path
          key={`base-${y}`}
          d={linkPath(y)}
          strokeWidth={1.25}
          strokeDasharray="2 3"
          strokeLinecap="round"
          className="stroke-muted-foreground/30"
        />
      ))}
      <motion.g initial={false} animate={{ opacity: on ? 1 : 0 }} transition={reduce ? UI_REDUCED_MOTION : UI_SPRING}>
        {STARTUP_LINKS.map((link) => (
          <StartupLink key={link.y} d={linkPath(link.y)} frames={link.frames} reduce={reduce} />
        ))}
      </motion.g>
    </svg>
  );
}
