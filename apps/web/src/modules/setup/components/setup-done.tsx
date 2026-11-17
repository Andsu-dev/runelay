import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/action/button";
import { UI_REDUCED_MOTION, UI_SPRING } from "@/components/ui/display/spring";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AgentChip } from "@/modules/activity/components/agent-chip";
import { DEFAULT_PROMPT_AGENT } from "@/modules/setup/constants/setup.constants";

interface SetupDoneProps {
  agents: string[];
  centered?: boolean;
  onNavigate?: () => void;
  children?: ReactNode;
}

export function SetupDone({ agents, centered = false, onNavigate, children }: SetupDoneProps) {
  const t = useT();
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={reduce ? UI_REDUCED_MOTION : UI_SPRING}
      className={cn("flex flex-col gap-3", centered ? "items-center text-center" : "rounded-xl bg-panel p-5")}
    >
      <div className={cn("flex flex-col gap-1.5", centered && "items-center")}>
        <h2 className="text-lg font-semibold tracking-[-0.01em]">{t("setup.done.title")}</h2>
        {agents.length > 0 && (
          <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1", centered && "justify-center")}>
            <span className="text-[13px] text-muted-foreground">{t("setup.done.using")}</span>
            {agents.map((agent) => (
              <AgentChip key={agent} name={agent} seed={agent} />
            ))}
          </div>
        )}
        <p className="text-[13px] text-pretty text-foreground">
          {t("setup.done.tryIt", { agent: agents[0] ?? DEFAULT_PROMPT_AGENT })}
        </p>
      </div>
      <div className={cn("flex w-full flex-wrap gap-2", centered && "justify-center")}>
        <Link
          to="/overview"
          onClick={onNavigate}
          className={buttonVariants({ className: cn("cursor-pointer", centered && "flex-1") })}
        >
          {t("setup.done.overview")}
          <HugeiconsIcon icon={ArrowRight02Icon} strokeWidth={1.8} />
        </Link>
        {children}
      </div>
    </motion.div>
  );
}
