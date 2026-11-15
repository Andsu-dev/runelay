import type { ReactNode } from "react";

interface LegendItemProps {
  color: string;
  label: string;
  value?: ReactNode;
}

export function LegendItem({ color, label, value }: LegendItemProps) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="truncate text-muted-foreground">{label}</span>
      {value !== undefined && <span className="font-medium text-foreground tabular-nums">{value}</span>}
    </span>
  );
}
