import { Activity01Icon, Alert02Icon, Clock01Icon, Key01Icon } from "@hugeicons/core-free-icons";
import { useSuspenseQuery } from "@tanstack/react-query";
import { formatNumber, formatPercent } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { apiKeysQuery } from "@/modules/api-keys/api/api-keys.api";
import { activitySummaryQuery } from "@/modules/overview/api/activity.api";
import { StatTile } from "./stat-tile";

export const STATS_RANGE_DAYS = 7;

export function ActivityStats() {
  const t = useT();
  const { data: summary } = useSuspenseQuery(activitySummaryQuery(STATS_RANGE_DAYS));
  const { data: keys } = useSuspenseQuery(apiKeysQuery);

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      <StatTile
        icon={Activity01Icon}
        tone="calls"
        label={t("activity.stats.calls")}
        value={formatNumber(summary.calls)}
        caption={t("activity.stats.callsMeta")}
      />
      <StatTile
        icon={Alert02Icon}
        tone="errors"
        label={t("activity.stats.errors")}
        value={formatPercent(summary.errorRate)}
        caption={t("activity.stats.errorsCaption", { count: formatNumber(summary.errors) })}
      />
      <StatTile
        icon={Clock01Icon}
        tone="latency"
        label={t("activity.stats.latency")}
        value={summary.averageMs === null ? "–" : `${formatNumber(summary.averageMs)} ms`}
        caption={t("activity.stats.latencyCaption")}
      />
      <StatTile
        icon={Key01Icon}
        tone="agents"
        label={t("activity.stats.agents")}
        value={formatNumber(keys.length)}
        caption={t("activity.stats.agentsCaption")}
      />
    </div>
  );
}
