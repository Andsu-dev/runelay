import { PlugSocketIcon } from "@hugeicons/core-free-icons";
import type { SourcesSummaryView } from "@runelay/shared";
import { Link } from "@tanstack/react-router";
import { formatNumber } from "@/lib/format";
import { StatValue } from "./stat-value";
import { WidgetCard } from "./widget-card";

interface ConnectionsWidgetProps {
  summary: SourcesSummaryView;
}

export function ConnectionsWidget({ summary }: ConnectionsWidgetProps) {
  return (
    <WidgetCard
      icon={PlugSocketIcon}
      title="Conexões"
      meta={
        <Link to="/connectors" search={{ tab: "installed" }} className="transition-colors hover:text-foreground">
          Ver todas
        </Link>
      }
    >
      <StatValue
        value={formatNumber(summary.total)}
        caption={
          <span>
            {formatNumber(summary.tools)} tools
            {summary.attention > 0 && (
              <span className="text-warning"> · {formatNumber(summary.attention)} pedem atenção</span>
            )}
          </span>
        }
      />
    </WidgetCard>
  );
}
