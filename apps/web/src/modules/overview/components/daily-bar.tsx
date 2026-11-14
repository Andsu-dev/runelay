import type { DailyCallsView } from "@runelay/shared";
import { Tooltip } from "@/components/ui/overlay/tooltip";
import { formatDay, formatNumber } from "@/lib/format";

interface DailyBarProps {
  day: DailyCallsView;
  peak: number;
}

export function DailyBar({ day, peak }: DailyBarProps) {
  const height = peak > 0 ? (day.calls / peak) * 100 : 0;
  const label = `${formatDay(day.day)}: ${formatNumber(day.calls)} chamadas, ${formatNumber(day.errors)} erros`;

  return (
    <Tooltip
      hideArrow
      contentClassName="flex flex-col gap-0.5 px-2.5 py-2"
      content={
        <span className="flex flex-col">
          <span className="text-[13px] font-semibold tabular-nums">{formatNumber(day.calls)} chamadas</span>
          <span className="text-background/70">
            {formatDay(day.day)}
            {day.errors > 0 && ` · ${formatNumber(day.errors)} erros`}
          </span>
        </span>
      }
    >
      <button
        type="button"
        aria-label={label}
        className="group flex h-full min-w-0 flex-1 cursor-default items-end justify-center rounded-sm outline-none focus-visible:bg-foreground/5"
      >
        <span
          style={{ height: day.calls > 0 ? `max(${height}%, 3px)` : "2px" }}
          className={
            day.calls > 0
              ? "w-full max-w-6 rounded-t-sm bg-foreground/75 transition-colors duration-150 group-hover:bg-foreground group-focus-visible:bg-foreground"
              : "w-full max-w-6 rounded-full bg-foreground/10"
          }
        />
      </button>
    </Tooltip>
  );
}
