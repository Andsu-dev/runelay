import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";
import { RollingText } from "@/modules/overview/components/rolling-text";

export const STAT_TONES = {
  calls: "text-chart-1",
  errors: "text-destructive",
  latency: "text-warning",
  agents: "text-success",
} as const;

interface StatTileProps {
  icon: IconSvgElement;
  tone: keyof typeof STAT_TONES;
  label: string;
  value: string;
  caption: ReactNode;
}

export function StatTile({ icon, tone, label, value, caption }: StatTileProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-muted/60 p-3.5 dark:bg-card">
      <span className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
        <HugeiconsIcon icon={icon} size={14} strokeWidth={1.8} className={STAT_TONES[tone]} />
        {label}
      </span>
      <RollingText value={value} className="text-2xl font-semibold tracking-[-0.03em] tabular-nums" />
      <span className="text-[12px] text-muted-foreground">{caption}</span>
    </div>
  );
}
