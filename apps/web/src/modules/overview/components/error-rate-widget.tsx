import { Alert02Icon } from "@hugeicons/core-free-icons";
import type { ActivitySummaryView } from "@runelay/shared";
import { formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ErrorDayStrip } from "./error-day-strip";
import { StatValue } from "./stat-value";
import { WidgetCard } from "./widget-card";

interface ErrorRateWidgetProps {
  summary: ActivitySummaryView;
}

export function ErrorRateWidget({ summary }: ErrorRateWidgetProps) {
  return (
    <WidgetCard
      icon={Alert02Icon}
      title="Taxa de erro"
      meta={summary.averageMs === null ? undefined : `${formatNumber(Math.round(summary.averageMs))} ms em média`}
    >
      <StatValue
        value={formatPercent(summary.errorRate)}
        caption={
          <span className={cn(summary.errors > 0 && "text-destructive")}>
            {summary.errors === 1 ? "1 chamada falhou" : `${formatNumber(summary.errors)} chamadas falharam`}
          </span>
        }
      />
      <div className="mt-auto">
        <ErrorDayStrip daily={summary.daily} />
      </div>
    </WidgetCard>
  );
}
