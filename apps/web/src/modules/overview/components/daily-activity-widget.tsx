import { ChartHistogramIcon } from "@hugeicons/core-free-icons";
import type { DailyCallsView } from "@runelay/shared";
import { useState } from "react";
import { formatCompact, formatDay, formatNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { ChartTooltip } from "./chart-tooltip";
import { DayTooltipContent } from "./day-tooltip-content";
import { LegendItem } from "./legend-item";
import { StackedDayBar } from "./stacked-day-bar";
import { WidgetCard } from "./widget-card";

interface DailyActivityWidgetProps {
  daily: DailyCallsView[];
}

export function DailyActivityWidget({ daily }: DailyActivityWidgetProps) {
  const t = useT();
  const peak = Math.max(0, ...daily.map((day) => day.calls));
  const context = daily.reduce((sum, day) => sum + day.context, 0);
  const connectors = daily.reduce((sum, day) => sum + day.calls, 0) - context;
  const first = daily[0];
  const last = daily.at(-1);
  const [active, setActive] = useState<number | null>(null);
  const [shown, setShown] = useState(0);
  const shownDay = daily[shown];
  const anchor =
    active === null || !shownDay ? null : { x: (shown + 0.5) / daily.length, y: peak > 0 ? shownDay.calls / peak : 0 };

  const activate = (index: number | null) => {
    setActive(index);
    if (index !== null) setShown(index);
  };

  return (
    <WidgetCard
      icon={ChartHistogramIcon}
      title={t("overview.daily.title")}
      meta={
        <span className="flex items-center gap-3">
          <LegendItem color="var(--chart-1)" label={t("overview.kinds.connectors")} value={formatNumber(connectors)} />
          <LegendItem color="var(--chart-2)" label={t("overview.kinds.context")} value={formatNumber(context)} />
        </span>
      }
    >
      <figure className="flex flex-col gap-2" aria-label={t("overview.daily.figure")}>
        <div className="relative">
          <span className="absolute top-0 left-0 text-[11px] text-muted-foreground tabular-nums">
            {formatCompact(peak)}
          </span>
          <div className="absolute inset-x-0 top-2 h-px bg-foreground/[0.06]" />
          <div className="absolute inset-x-0 top-[calc(50%+0.625rem)] h-px bg-foreground/[0.04]" />
          <div className="relative flex h-56 items-end gap-1 pt-5" onPointerLeave={() => setActive(null)}>
            {daily.map((day, index) => (
              <StackedDayBar
                key={day.day}
                day={day}
                peak={peak}
                index={index}
                dimmed={active !== null && active !== index}
                onActivate={activate}
              />
            ))}
            <div className="pointer-events-none absolute inset-x-0 top-5 bottom-0">
              <ChartTooltip anchor={anchor}>{shownDay && <DayTooltipContent day={shownDay} />}</ChartTooltip>
            </div>
          </div>
          <div className="h-px bg-foreground/10" />
        </div>
        <figcaption className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
          <span>{first && formatDay(first.day)}</span>
          <span>{last && formatDay(last.day)}</span>
        </figcaption>
      </figure>
    </WidgetCard>
  );
}
