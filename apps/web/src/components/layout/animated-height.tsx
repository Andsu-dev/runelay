import { motion, useReducedMotion } from "motion/react";
import { type ReactNode, useState } from "react";

interface AnimatedHeightProps {
  children: ReactNode;
}

const RESIZE = { duration: 0.35, ease: [0.22, 1, 0.36, 1] } as const;

export function AnimatedHeight({ children }: AnimatedHeightProps) {
  const still = Boolean(useReducedMotion());
  const [height, setHeight] = useState<number | "auto">("auto");

  const measure = (node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setHeight(entry.contentRect.height);
    });
    observer.observe(node);
    return () => observer.disconnect();
  };

  return (
    <motion.div
      initial={false}
      animate={{ height }}
      transition={still ? { duration: 0 } : RESIZE}
      className="overflow-clip"
    >
      <div ref={measure}>{children}</div>
    </motion.div>
  );
}
