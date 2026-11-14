import type { DailyCallsView } from "@runelay/shared";
import { formatCompact, formatDay } from "@/lib/format";
import { DailyBar } from "./daily-bar";

interface DailyCallsChartProps {
  daily: DailyCallsView[];
}

export function DailyCallsChart({ daily }: DailyCallsChartProps) {
  const peak = Math.max(0, ...daily.map((day) => day.calls));
  const first = daily[0];
  const last = daily.at(-1);

  return (
    <figure className="flex flex-col gap-2" aria-label="Chamadas por dia">
      <div className="relative">
        <span className="absolute top-0 left-0 text-[11px] text-muted-foreground tabular-nums">
          {formatCompact(peak)}
        </span>
        <div className="absolute inset-x-0 top-2 h-px bg-border/60" />
        <div className="flex h-40 items-end gap-[2px] border-b border-border pt-5">
          {daily.map((day) => (
            <DailyBar key={day.day} day={day} peak={peak} />
          ))}
        </div>
      </div>
      <figcaption className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
        <span>{first && formatDay(first.day)}</span>
        <span>{last && formatDay(last.day)}</span>
      </figcaption>
    </figure>
  );
}
