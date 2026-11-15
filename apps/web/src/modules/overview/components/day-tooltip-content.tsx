import type { DailyCallsView } from "@runelay/shared";
import { formatDay, formatNumber } from "@/lib/format";

interface DayTooltipContentProps {
  day: DailyCallsView;
}

export function DayTooltipContent({ day }: DayTooltipContentProps) {
  return (
    <span className="flex flex-col gap-1">
      <span className="text-[13px] font-semibold tabular-nums">{formatNumber(day.calls)} chamadas</span>
      <span className="flex items-center gap-1.5 text-background/70">
        <span className="size-2 rounded-full bg-chart-1" />
        Conectores <span className="text-background tabular-nums">{formatNumber(day.calls - day.context)}</span>
      </span>
      <span className="flex items-center gap-1.5 text-background/70">
        <span className="size-2 rounded-full bg-chart-2" />
        Contexto <span className="text-background tabular-nums">{formatNumber(day.context)}</span>
      </span>
      <span className="text-background/70">
        {formatDay(day.day)}
        {day.errors > 0 && ` · ${formatNumber(day.errors)} erros`}
      </span>
    </span>
  );
}
