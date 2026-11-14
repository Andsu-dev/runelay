import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { UI_SPRING } from "@/components/ui/display/spring";
import { needsAuthQuery } from "@/modules/sources/api/sources.api";

export function ReconnectBanner() {
  const { data } = useQuery(needsAuthQuery);
  const total = data?.length ?? 0;
  return (
    <AnimatePresence initial={false}>
      {total > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={UI_SPRING}
          className="overflow-hidden"
        >
          <Link
            to="/connectors/reconnect"
            className="group flex items-center gap-3 rounded-xl bg-card px-4 py-3 text-sm shadow-xs outline-none transition-colors duration-200 hover:bg-card/70 focus-visible:ring-2 focus-visible:ring-ring/25"
          >
            <span className="size-2 shrink-0 rounded-full bg-warning" />
            <span className="flex-1">
              {total === 1 ? "1 conta pede login" : `${total} contas pedem login`}.{" "}
              <span className="text-muted-foreground">Faça todos em sequência.</span>
            </span>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={16}
              className="text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
