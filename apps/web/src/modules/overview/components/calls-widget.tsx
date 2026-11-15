import { Analytics01Icon } from "@hugeicons/core-free-icons";
import type { ActivitySummaryView } from "@runelay/shared";
import { formatNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { AreaSparkline } from "./area-sparkline";
import { DeltaBadge } from "./delta-badge";
import { StatValue } from "./stat-value";
import { WidgetCard } from "./widget-card";

interface CallsWidgetProps {
  summary: ActivitySummaryView;
}

export function CallsWidget({ summary }: CallsWidgetProps) {
  const t = useT();

  return (
    <WidgetCard
      icon={Analytics01Icon}
      title={t("overview.callsWidget.title")}
      meta={t("overview.callsWidget.days", { days: summary.days })}
    >
      <StatValue
        value={formatNumber(summary.calls)}
        trailing={<DeltaBadge changePercent={summary.changePercent} />}
        caption={
          summary.changePercent === null ? t("overview.callsWidget.noPrevious") : t("overview.callsWidget.vsPrevious")
        }
      />
      <div className="mt-auto">
        <AreaSparkline
          values={summary.daily.map((day) => day.calls)}
          color="var(--chart-1)"
          label={t("overview.callsWidget.sparkline")}
        />
      </div>
    </WidgetCard>
  );
}
