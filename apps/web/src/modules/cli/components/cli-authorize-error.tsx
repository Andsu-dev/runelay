import { Alert02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { motion } from "motion/react";
import { UI_SPRING } from "@/components/ui/display/spring";
import { translateError, useT } from "@/lib/i18n";

export function CliAuthorizeError({ error }: ErrorComponentProps) {
  const t = useT();

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={UI_SPRING}
        className="flex w-full max-w-sm flex-col items-center gap-3 text-center"
      >
        <HugeiconsIcon icon={Alert02Icon} size={28} strokeWidth={1.6} className="text-destructive" />
        <h1 className="text-lg font-semibold">{t("cli.error.title")}</h1>
        <p className="text-[13px] text-muted-foreground">{translateError(error, t("cli.error.fallback"))}</p>
      </motion.div>
    </main>
  );
}
