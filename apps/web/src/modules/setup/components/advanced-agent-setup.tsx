import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/action/button";
import { UI_REDUCED_MOTION, UI_SPRING } from "@/components/ui/display/spring";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { McpEndpoint } from "@/modules/settings/components/mcp-endpoint";
import { ClientBranches } from "./client-branches";

export function AdvancedAgentSetup() {
  const t = useT();
  const reduce = useReducedMotion();
  const spring = reduce ? UI_REDUCED_MOTION : UI_SPRING;
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="cursor-pointer self-start"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="advanced-agent-setup"
      >
        {t("setup.agents.advanced")}
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          strokeWidth={1.8}
          className={cn("transition-transform duration-200", open && "rotate-180")}
        />
      </Button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="advanced"
            id="advanced-agent-setup"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 pt-1">
              <McpEndpoint />
              <ClientBranches />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
