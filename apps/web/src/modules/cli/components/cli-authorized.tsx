import { motion } from "motion/react";
import { UI_SPRING } from "@/components/ui/display/spring";

export function CliAuthorized() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={UI_SPRING}
      className="flex flex-col items-center gap-4 text-center"
    >
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...UI_SPRING, mass: 0.7 }}
        className="flex size-14 items-center justify-center rounded-full bg-success/12 text-success"
      >
        <svg viewBox="0 0 24 24" aria-hidden className="size-7" fill="none">
          <motion.path
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.12, ease: [0.2, 0, 0, 1] }}
          />
        </svg>
      </motion.span>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-[-0.02em]">Pronto, pode voltar para o terminal.</h1>
        <p className="text-[13px] text-muted-foreground">O runeley CLI já recebeu a chave deste computador.</p>
      </div>
    </motion.div>
  );
}
