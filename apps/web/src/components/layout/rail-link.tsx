import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { UI_SPRING } from "@/components/ui/display/spring";
import { Tooltip } from "@/components/ui/overlay/tooltip";
import { cn } from "@/lib/utils";
import type { NavCategory } from "./nav.types";

interface RailLinkProps {
  category: NavCategory;
  active: boolean;
}

export function RailLink({ category, active }: RailLinkProps) {
  return (
    <Tooltip content={category.label} side="right" hideArrow>
      <Link
        {...category.link}
        aria-label={category.label}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex size-9 items-center justify-center rounded-lg transition-colors duration-200 pressable",
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        {active && (
          <motion.span
            layoutId="rail-active"
            transition={UI_SPRING}
            className="absolute inset-0 rounded-lg bg-sidebar-active ring-1 ring-border/70"
          />
        )}
        <HugeiconsIcon icon={category.icon} size={18} strokeWidth={1.5} className="relative" />
      </Link>
    </Tooltip>
  );
}
