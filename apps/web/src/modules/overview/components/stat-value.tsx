import type { ReactNode } from "react";

interface StatValueProps {
  value: string;
  caption?: ReactNode;
  trailing?: ReactNode;
}

export function StatValue({ value, caption, trailing }: StatValueProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-[-0.03em]">{value}</span>
        {trailing}
      </div>
      {caption && <p className="text-[12px] text-muted-foreground">{caption}</p>}
    </div>
  );
}
