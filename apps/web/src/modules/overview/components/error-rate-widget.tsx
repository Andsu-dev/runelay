import { Alert02Icon } from "@hugeicons/core-free-icons";
import type { ActivitySummaryView } from "@runelay/shared";
import { formatPercent } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ErrorDayStrip } from "./error-day-strip";
import { StatValue } from "./stat-value";
import { WidgetCard } from "./widget-card";

interface ErrorRateWidgetProps {
  summary: ActivitySummaryView;
}

export function ErrorRateWidget({ summary }: ErrorRateWidgetProps) {
  const t = useT();

  return (
    <WidgetCard
      icon={Alert02Icon}
      title={t("overview.errorRate.title")}
      meta={
        summary.averageMs === null ? undefined : t("overview.errorRate.average", { ms: Math.round(summary.averageMs) })
      }
    >
      <StatValue
        value={formatPercent(summary.errorRate)}
        caption={
          <span className={cn(summary.errors > 0 && "text-destructive")}>
            {t.plural("overview.errorRate.failed", summary.errors)}
          </span>
        }
      />
      <div className="mt-auto">
        <ErrorDayStrip daily={summary.daily} />
      </div>
    </WidgetCard>
  );
}
