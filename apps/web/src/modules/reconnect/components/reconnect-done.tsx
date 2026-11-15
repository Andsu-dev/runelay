import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { buttonVariants } from "@/components/ui/action/button";
import { PixelConfetti } from "@/components/ui/display/pixel-confetti";
import { UI_SPRING } from "@/components/ui/display/spring";
import { useT } from "@/lib/i18n";

interface ReconnectDoneProps {
  connected: number;
  skipped: number;
}

export function ReconnectDone({ connected, skipped }: ReconnectDoneProps) {
  const t = useT();
  const title =
    connected === 0 ? t("reconnect.done.none") : skipped ? t("reconnect.done.almost") : t("reconnect.done.all");
  const description = skipped ? t.plural("reconnect.done.skipped", skipped) : t("reconnect.done.ready");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={UI_SPRING}
      className="flex flex-col items-center gap-4 rounded-xl bg-card px-6 py-10 text-center"
    >
      {connected > 0 && <PixelConfetti />}
      <div className="flex max-w-sm flex-col gap-1">
        <p className="text-base font-semibold">{title}</p>
        <p className="text-[13px] text-pretty text-muted-foreground">{description}</p>
      </div>
      <Link to="/connectors" search={{ tab: "installed" }} className={buttonVariants({ variant: "glass", size: "sm" })}>
        {t("reconnect.done.viewConnectors")}
      </Link>
    </motion.div>
  );
}
