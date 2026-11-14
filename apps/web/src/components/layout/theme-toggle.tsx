import { ComputerIcon, Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/action/button";
import { Tooltip } from "@/components/ui/overlay/tooltip";
import { nextTheme, setTheme, type Theme, useTheme } from "@/lib/theme";

const THEME_META = {
  system: { icon: ComputerIcon, label: "Tema do sistema" },
  light: { icon: Sun03Icon, label: "Tema claro" },
  dark: { icon: Moon02Icon, label: "Tema escuro" },
} satisfies Record<Theme, unknown>;

export function ThemeToggle() {
  const theme = useTheme();
  const meta = THEME_META[theme];

  return (
    <Tooltip content={`${meta.label}. Clique para trocar.`} side="right" hideArrow>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(nextTheme(theme))}
        aria-label={meta.label}
        className="overflow-hidden"
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={theme}
            initial={{ opacity: 0, rotate: -40, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 40, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 420, damping: 30, mass: 0.6 }}
            className="flex"
          >
            <HugeiconsIcon icon={meta.icon} size={18} strokeWidth={1.6} />
          </motion.span>
        </AnimatePresence>
      </Button>
    </Tooltip>
  );
}
