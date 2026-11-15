import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { RouteError } from "@/components/ui/display/route-error";
import { useT } from "@/lib/i18n";
import { meQuery } from "@/modules/auth/api/session.api";
import { activitySummaryQuery } from "@/modules/overview/api/activity.api";
import { OverviewDashboard } from "@/modules/overview/components/overview-dashboard";
import { OverviewSkeleton } from "@/modules/overview/components/overview-skeleton";
import { sourcesSummaryQuery } from "@/modules/sources/api/sources.api";

const RANGE_DAYS = 30;

export const Route = createFileRoute("/_app/overview")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(activitySummaryQuery(RANGE_DAYS)),
      context.queryClient.ensureQueryData(sourcesSummaryQuery),
    ]),
  pendingComponent: OverviewSkeleton,
  errorComponent: RouteError,
  component: OverviewPage,
});

function OverviewPage() {
  const t = useT();
  const { data: me } = useSuspenseQuery(meQuery);
  const { data: activity } = useSuspenseQuery(activitySummaryQuery(RANGE_DAYS));
  const { data: sources } = useSuspenseQuery(sourcesSummaryQuery);
  const firstName = me.user.name.trim().split(/\s+/)[0] ?? me.user.name;

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-0.5">
        <h1 className="text-xl font-semibold tracking-[-0.02em]">
          {t("overview.header.welcome", { name: firstName })}
        </h1>
        <p className="text-[13px] text-muted-foreground">
          {t("overview.header.range", { days: activity.days, organization: me.organization.name })}
        </p>
      </header>
      <OverviewDashboard activity={activity} sources={sources} />
    </section>
  );
}
