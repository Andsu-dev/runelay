import type { RankedCountView } from "@runelay/shared";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { formatNumber, formatPercent } from "@/lib/format";

interface RankedBarRowProps {
  item: RankedCountView;
  leading?: ReactNode;
}

export function RankedBarRow({ item, leading }: RankedBarRowProps) {
  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-[13px]">
        {leading}
        <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
        <span className="font-semibold tabular-nums">{formatNumber(item.calls)}</span>
        <span className="w-12 text-right text-[12px] text-muted-foreground tabular-nums">
          {formatPercent(item.share)}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(item.share, 1) * 100}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full bg-linear-to-r from-chart-1/60 to-chart-1"
        />
      </div>
    </li>
  );
}
