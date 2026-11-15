import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { RouteError } from "@/components/ui/display/route-error";
import { useT } from "@/lib/i18n";
import type { ActivityCallsFilter } from "@/modules/activity/api/activity-calls.api";
import { ActivityFilters } from "@/modules/activity/components/activity-filters";
import { ActivityList } from "@/modules/activity/components/activity-list";
import { ActivityStats, STATS_RANGE_DAYS } from "@/modules/activity/components/activity-stats";
import { ActivityStatsSkeleton } from "@/modules/activity/components/activity-stats-skeleton";
import { apiKeysQuery } from "@/modules/api-keys/api/api-keys.api";
import { activitySummaryQuery } from "@/modules/overview/api/activity.api";

export const Route = createFileRoute("/_app/activity")({
  validateSearch: z.object({
    keyId: z.string().optional(),
    source: z.string().optional(),
    status: z.enum(["ok", "error"]).optional(),
    query: z.string().optional(),
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(activitySummaryQuery(STATS_RANGE_DAYS)),
      context.queryClient.ensureQueryData(apiKeysQuery),
    ]),
  pendingComponent: ActivityStatsSkeleton,
  errorComponent: RouteError,
  component: ActivityPage,
});

function ActivityPage() {
  const t = useT();
  const filter: ActivityCallsFilter = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const filtered = Object.values(filter).some(Boolean);

  const change = (next: Partial<ActivityCallsFilter>) =>
    navigate({ search: (prev) => ({ ...prev, ...next }), replace: true });

  return (
    <section className="flex flex-col gap-5">
      <header className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h1 className="text-lg font-semibold">{t("activity.title")}</h1>
          <p className="text-[13px] text-muted-foreground">{t("activity.description")}</p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[12px] font-medium text-success">
          <span className="relative flex size-1.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-success opacity-60" />
            <span className="relative size-1.5 rounded-full bg-success" />
          </span>
          {t("activity.live")}
        </span>
      </header>
      <ActivityStats />
      <ActivityFilters filter={filter} onChange={change} />
      <ActivityList filter={filter} filtered={filtered} />
    </section>
  );
}
