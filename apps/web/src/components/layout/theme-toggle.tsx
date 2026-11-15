import { ComputerIcon, Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/action/button";
import { Tooltip } from "@/components/ui/overlay/tooltip";
import { type MessageKey, useT } from "@/lib/i18n";
import { nextTheme, setTheme, type Theme, useTheme } from "@/lib/theme";

const THEME_META = {
  system: { icon: ComputerIcon, label: "layout.theme.system" },
  light: { icon: Sun03Icon, label: "layout.theme.light" },
  dark: { icon: Moon02Icon, label: "layout.theme.dark" },
} as const satisfies Record<Theme, { icon: IconSvgElement; label: MessageKey }>;

export function ThemeToggle() {
  const t = useT();
  const theme = useTheme();
  const meta = THEME_META[theme];
  const label = t(meta.label);

  return (
    <Tooltip content={t("layout.theme.tooltip", { label })} side="right" hideArrow>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(nextTheme(theme))}
        aria-label={label}
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
