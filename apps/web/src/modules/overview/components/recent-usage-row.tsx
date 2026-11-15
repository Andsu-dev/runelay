import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import type { RecentUsageView } from "@runelay/shared";
import { motion } from "motion/react";
import { formatNumber, formatRelative } from "@/lib/format";

interface RecentUsageRowProps {
  item: RecentUsageView;
  icon: IconSvgElement;
  color: string;
  peak: number;
}

export function RecentUsageRow({ item, icon, color, peak }: RecentUsageRowProps) {
  const share = peak > 0 ? item.calls / peak : 0;

  return (
    <li className="flex min-h-11 items-center gap-3 text-[13px]">
      <span
        aria-hidden
        className="flex size-7 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: `color-mix(in oklch, ${color} 14%, transparent)`, color }}
      >
        <HugeiconsIcon icon={icon} size={14} strokeWidth={1.8} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="truncate font-mono text-[12px]">{item.name}</span>
        <span className="h-1 overflow-hidden rounded-full bg-foreground/[0.06]">
          <motion.span
            initial={{ width: 0 }}
            animate={{ width: `${share * 100}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="block h-full rounded-full"
            style={{ backgroundColor: color }}
          />
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="rounded-full bg-foreground/5 px-1.5 text-[12px] font-medium tabular-nums">
          {formatNumber(item.calls)}
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">{formatRelative(item.lastUsedAt)}</span>
      </span>
    </li>
  );
}
