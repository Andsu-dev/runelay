import type { DailyCallsView } from "@runelay/shared";
import { formatDay, formatNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";

interface DayTooltipContentProps {
  day: DailyCallsView;
}

export function DayTooltipContent({ day }: DayTooltipContentProps) {
  const t = useT();

  return (
    <span className="flex flex-col gap-1">
      <span className="text-[13px] font-semibold tabular-nums">{t.plural("overview.calls", day.calls)}</span>
      <span className="flex items-center gap-1.5 text-background/70">
        <span className="size-2 rounded-full bg-chart-1" />
        {t("overview.kinds.connectors")}{" "}
        <span className="text-background tabular-nums">{formatNumber(day.calls - day.context)}</span>
      </span>
      <span className="flex items-center gap-1.5 text-background/70">
        <span className="size-2 rounded-full bg-chart-2" />
        {t("overview.kinds.context")} <span className="text-background tabular-nums">{formatNumber(day.context)}</span>
      </span>
      <span className="text-background/70">
        {formatDay(day.day)}
        {day.errors > 0 && ` · ${t.plural("overview.errors", day.errors)}`}
      </span>
    </span>
  );
}
