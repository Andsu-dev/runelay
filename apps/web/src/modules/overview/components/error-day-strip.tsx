import type { DailyCallsView } from "@runelay/shared";
import { useState } from "react";
import { formatDay } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ChartTooltip } from "./chart-tooltip";

interface ErrorDayStripProps {
  daily: DailyCallsView[];
}

export function ErrorDayStrip({ daily }: ErrorDayStripProps) {
  const t = useT();
  const peak = Math.max(1, ...daily.map((day) => day.errors));
  const [active, setActive] = useState<number | null>(null);
  const [shown, setShown] = useState(0);
  const shownDay = daily[shown];

  const activate = (index: number | null) => {
    setActive(index);
    if (index !== null) setShown(index);
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        role="img"
        aria-label={t("overview.errorRate.strip")}
        className="relative flex h-8 gap-[3px]"
        onPointerLeave={() => activate(null)}
      >
        {daily.map((day, index) => (
          <button
            key={day.day}
            type="button"
            aria-label={`${formatDay(day.day)}: ${t.plural("overview.errors", day.errors)}`}
            onPointerEnter={() => activate(index)}
            onFocus={() => activate(index)}
            onBlur={() => activate(null)}
            className={cn(
              "min-w-0 flex-1 cursor-default rounded-[3px] bg-foreground/[0.06] outline-none transition-opacity duration-150 focus-visible:ring-2 focus-visible:ring-ring",
              active !== null && active !== index && "opacity-40",
            )}
            style={
              day.errors > 0
                ? {
                    backgroundColor: `color-mix(in oklch, var(--destructive) ${30 + (day.errors / peak) * 70}%, transparent)`,
                  }
                : undefined
            }
          />
        ))}
        <ChartTooltip anchor={active === null ? null : { x: (shown + 0.5) / daily.length, y: 1 }}>
          {shownDay && (
            <span className="flex flex-col">
              <span className="text-[13px] font-semibold tabular-nums">
                {t.plural("overview.errors", shownDay.errors)}
              </span>
              <span className="text-background/70">
                {formatDay(shownDay.day)} · {t.plural("overview.calls", shownDay.calls)}
              </span>
            </span>
          )}
        </ChartTooltip>
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
        <span>{daily[0] && formatDay(daily[0].day)}</span>
        <span>{daily.at(-1) && formatDay(daily.at(-1)?.day ?? "")}</span>
      </div>
    </div>
  );
}
