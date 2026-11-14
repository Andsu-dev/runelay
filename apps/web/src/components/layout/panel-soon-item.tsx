import { HugeiconsIcon } from "@hugeicons/react";
import type { NavSoonItem } from "./nav.types";

interface PanelSoonItemProps {
  item: NavSoonItem;
}

export function PanelSoonItem({ item }: PanelSoonItemProps) {
  return (
    <div
      aria-disabled="true"
      className="flex min-h-11 cursor-not-allowed items-center gap-2.5 rounded-md px-2.5 text-[13px] text-muted-foreground/55 lg:min-h-8"
    >
      <HugeiconsIcon icon={item.icon} size={16} strokeWidth={1.5} />
      <span className="flex-1">{item.label}</span>
      <span className="rounded-md px-1.5 py-px text-[10px] text-muted-foreground/70 ring-1 ring-border/80">
        Em breve
      </span>
    </div>
  );
}
