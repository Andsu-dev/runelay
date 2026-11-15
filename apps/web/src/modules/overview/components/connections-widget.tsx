import { PlugSocketIcon } from "@hugeicons/core-free-icons";
import type { SourcesSummaryView } from "@runelay/shared";
import { Link } from "@tanstack/react-router";
import { formatNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { StatValue } from "./stat-value";
import { WidgetCard } from "./widget-card";

interface ConnectionsWidgetProps {
  summary: SourcesSummaryView;
}

export function ConnectionsWidget({ summary }: ConnectionsWidgetProps) {
  const t = useT();

  return (
    <WidgetCard
      icon={PlugSocketIcon}
      title={t("overview.connections.title")}
      meta={
        <Link to="/connectors" search={{ tab: "installed" }} className="transition-colors hover:text-foreground">
          {t("overview.connections.viewAll")}
        </Link>
      }
    >
      <StatValue
        value={formatNumber(summary.total)}
        caption={
          <span>
            {t("overview.connections.tools", { count: summary.tools })}
            {summary.attention > 0 && (
              <span className="text-warning">
                {" "}
                · {t("overview.connections.attention", { count: summary.attention })}
              </span>
            )}
          </span>
        }
      />
    </WidgetCard>
  );
}
