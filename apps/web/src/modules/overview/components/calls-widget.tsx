import { Analytics01Icon } from "@hugeicons/core-free-icons";
import type { ActivitySummaryView } from "@runelay/shared";
import { formatNumber } from "@/lib/format";
import { DailyCallsChart } from "./daily-calls-chart";
import { DeltaBadge } from "./delta-badge";
import { StatValue } from "./stat-value";
import { WidgetCard } from "./widget-card";

interface CallsWidgetProps {
  summary: ActivitySummaryView;
}

export function CallsWidget({ summary }: CallsWidgetProps) {
  return (
    <WidgetCard icon={Analytics01Icon} title="Chamadas" meta={`${summary.days} dias`}>
      <StatValue
        value={formatNumber(summary.calls)}
        trailing={<DeltaBadge changePercent={summary.changePercent} />}
        caption={
          summary.changePercent === null ? "Sem período anterior para comparar." : "Em relação ao período anterior."
        }
      />
      <DailyCallsChart daily={summary.daily} />
    </WidgetCard>
  );
}
