import { AnimatePresence, motion } from "motion/react";
import { maskName, useNamesHidden } from "@/lib/hidden-names";
import { cn } from "@/lib/utils";

interface MaskedNameProps {
  value: string;
  className?: string;
}

const SPRING = { type: "spring", stiffness: 420, damping: 34, mass: 0.7 } as const;
const BLURRED = { opacity: 0, filter: "blur(4px)" };
const SHARP = { opacity: 1, filter: "blur(0px)", y: 0 };

export function MaskedName({ value, className }: MaskedNameProps) {
  const hidden = useNamesHidden();

  return (
    <span className={cn("inline-grid min-w-0 *:col-start-1 *:row-start-1", className)}>
      <AnimatePresence initial={false}>
        {hidden ? (
          <motion.span
            key="masked"
            aria-label="Nome escondido"
            exit={{ ...BLURRED, y: -3, transition: { duration: 0.16 } }}
            className="truncate tracking-[0.12em]"
          >
            {Array.from(maskName(value), (_, position) => position).map((position) => (
              <motion.span
                key={position}
                initial={{ ...BLURRED, y: 5, scale: 0.6 }}
                animate={{ ...SHARP, scale: 1 }}
                transition={{ ...SPRING, delay: position * 0.018 }}
                className="inline-block"
              >
                *
              </motion.span>
            ))}
          </motion.span>
        ) : (
          <motion.span
            key="value"
            initial={{ ...BLURRED, y: 4 }}
            animate={SHARP}
            exit={{ ...BLURRED, y: -3, transition: { duration: 0.16 } }}
            transition={SPRING}
            className="truncate"
          >
            {value}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
