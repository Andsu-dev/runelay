import { Activity01Icon } from "@hugeicons/core-free-icons";
import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { LoadMoreSentinel } from "@/components/ui/data/load-more-sentinel";
import { EmptyState } from "@/components/ui/display/empty-state";
import { Skeleton } from "@/components/ui/display/skeleton";
import { UI_SPRING } from "@/components/ui/display/spring";
import { formatDay, formatNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { type ActivityCallsFilter, activityCallsQuery } from "@/modules/activity/api/activity-calls.api";
import { sourcesQuery } from "@/modules/sources/api/sources.api";
import { ActivityRow } from "./activity-row";

const PLACEHOLDERS = [0, 1, 2, 3, 4, 5, 6, 7];

interface ActivityListProps {
  filter: ActivityCallsFilter;
  filtered: boolean;
}

export function ActivityList({ filter, filtered }: ActivityListProps) {
  const t = useT();
  const { data: sources } = useQuery(sourcesQuery);
  const { data, isPending, isPlaceholderData, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
    ...activityCallsQuery(filter),
    placeholderData: keepPreviousData,
  });

  if (isPending) {
    return (
      <div className="flex flex-col gap-1.5" aria-busy="true">
        {PLACEHOLDERS.map((item) => (
          <Skeleton key={item} className="h-11 rounded-lg bg-muted/60" />
        ))}
      </div>
    );
  }

  const calls = data?.pages.flatMap((page) => page.items) ?? [];

  if (calls.length === 0) {
    return (
      <EmptyState
        icon={Activity01Icon}
        title={filtered ? t("activity.list.emptyFilteredTitle") : t("activity.list.emptyTitle")}
        description={filtered ? t("activity.list.emptyFilteredDescription") : t("activity.list.emptyDescription")}
      />
    );
  }

  const icons = new Map((sources ?? []).map((source) => [source.name, source.icon]));
  const slowestMs = Math.max(...calls.map((call) => call.durationMs));
  const days = Map.groupBy(calls, (call) => call.createdAt.slice(0, 10));

  return (
    <div className={cn("flex flex-col gap-4 transition-opacity duration-200", isPlaceholderData && "opacity-60")}>
      {[...days].map(([day, dayCalls]) => (
        <section key={day} className="flex flex-col rounded-xl bg-muted/60 p-1 dark:bg-card">
          <header className="flex min-h-8 items-center justify-between px-2.5 text-[12px] font-medium text-muted-foreground">
            <span>{formatDay(dayCalls[0]?.createdAt ?? day)}</span>
            <span className="tabular-nums">{formatNumber(dayCalls.length)}</span>
          </header>
          <ul className="flex flex-col rounded-lg bg-background p-1 shadow-xs dark:bg-muted/40">
            <AnimatePresence initial={false}>
              {dayCalls.map((call) => (
                <motion.li
                  key={call.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ ...UI_SPRING, mass: 0.7 }}
                  className="overflow-hidden"
                >
                  <ActivityRow call={call} icon={icons.get(call.source) ?? null} slowestMs={slowestMs} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </section>
      ))}
      <LoadMoreSentinel active={hasNextPage} busy={isFetchingNextPage} onReach={() => fetchNextPage()} />
    </div>
  );
}
