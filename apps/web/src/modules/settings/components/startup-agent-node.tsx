import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { motion } from "motion/react";
import { UI_REDUCED_MOTION, UI_SPRING } from "@/components/ui/display/spring";
import { useStartupLoop } from "@/modules/settings/hooks/use-startup-loop";

interface StartupAgentNodeProps {
  icon: IconSvgElement;
  frames: Keyframe[];
  on: boolean;
  reduce: boolean;
}

export function StartupAgentNode({ icon, frames, on, reduce }: StartupAgentNodeProps) {
  const loop = useStartupLoop(frames, reduce);

  return (
    <div className="relative size-6">
      <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60 text-muted-foreground/45">
        <HugeiconsIcon icon={icon} size={12} strokeWidth={1.8} />
      </span>
      <motion.span
        initial={false}
        animate={{ opacity: on ? 1 : 0 }}
        transition={reduce ? UI_REDUCED_MOTION : UI_SPRING}
        className="absolute inset-0"
      >
        <span
          ref={loop}
          className="relative flex size-full items-center justify-center rounded-full bg-background text-foreground shadow-xs"
        >
          <HugeiconsIcon icon={icon} size={12} strokeWidth={1.8} />
          <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-success ring-2 ring-muted" />
        </span>
      </motion.span>
    </div>
  );
}
