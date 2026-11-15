import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { UI_SPRING } from "@/components/ui/display/spring";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { NavLinkItem } from "./nav.types";
import { useLinkActive } from "./use-link-active";

interface PanelLinkProps {
  item: NavLinkItem;
  scope: string;
  onNavigate?: () => void;
}

export function PanelLink({ item, scope, onNavigate }: PanelLinkProps) {
  const t = useT();
  const active = useLinkActive(item.link);

  return (
    <Link
      {...item.link}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex min-h-11 items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors duration-200 lg:min-h-8",
        active ? "text-foreground" : "text-panel-item hover:text-foreground",
      )}
    >
      {active && (
        <motion.span
          layoutId={`${scope}-panel-active`}
          transition={UI_SPRING}
          className="absolute inset-0 rounded-md bg-sidebar-active ring-1 ring-border/50"
        />
      )}
      <HugeiconsIcon
        icon={item.icon}
        size={16}
        strokeWidth={1.5}
        className={cn("relative transition-colors duration-200", active ? "text-foreground" : "text-muted-foreground")}
      />
      <span className="relative">{t(item.label)}</span>
    </Link>
  );
}
