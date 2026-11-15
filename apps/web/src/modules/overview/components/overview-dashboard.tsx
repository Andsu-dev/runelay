import type { ActivitySummaryView, SourcesSummaryView } from "@runelay/shared";
import { OverviewPreview } from "./overview-preview";
import { OverviewWidgets } from "./overview-widgets";

interface OverviewDashboardProps {
  activity: ActivitySummaryView;
  sources: SourcesSummaryView;
}

export function OverviewDashboard({ activity, sources }: OverviewDashboardProps) {
  if (activity.calls === 0) return <OverviewPreview />;

  return <OverviewWidgets activity={activity} sources={sources} />;
}
