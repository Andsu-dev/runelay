import { motion } from "motion/react";
import type { ReactNode } from "react";

interface StaggerInProps {
  children: ReactNode;
  className?: string;
  gap?: number;
}

export function StaggerIn({ children, className, gap = 0.1 }: StaggerInProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}
