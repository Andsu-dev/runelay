import { useInfiniteQuery } from "@tanstack/react-query";
import { formatNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { type ActivityCallsFilter, activityCallsQuery } from "@/modules/activity/api/activity-calls.api";

interface ActivityTotalProps {
  filter: ActivityCallsFilter;
}

export function ActivityTotal({ filter }: ActivityTotalProps) {
  const t = useT();
  const { data } = useInfiniteQuery(activityCallsQuery(filter));
  const total = data?.pages[0]?.total;
  if (total === undefined) return null;
  return (
    <span className="shrink-0 text-[12px] text-muted-foreground tabular-nums">
      {t.plural("activity.list.total", total, { count: formatNumber(total) })}
    </span>
  );
}
