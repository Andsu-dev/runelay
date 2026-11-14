import type { ActivitySummaryView, SourcesSummaryView } from "@runelay/shared";
import { StaggerIn } from "@/components/layout/stagger-in";
import { StaggerItem } from "@/components/layout/stagger-item";
import { CallsBySourceWidget } from "./calls-by-source-widget";
import { CallsWidget } from "./calls-widget";
import { ConnectionsWidget } from "./connections-widget";
import { ErrorRateWidget } from "./error-rate-widget";
import { OverviewEmpty } from "./overview-empty";
import { TopToolsWidget } from "./top-tools-widget";

interface OverviewDashboardProps {
  activity: ActivitySummaryView;
  sources: SourcesSummaryView;
}

export function OverviewDashboard({ activity, sources }: OverviewDashboardProps) {
  if (activity.calls === 0) {
    return (
      <StaggerIn className="grid gap-3 md:grid-cols-3" gap={0.06}>
        <StaggerItem className="md:col-span-2">
          <OverviewEmpty />
        </StaggerItem>
        <StaggerItem>
          <ConnectionsWidget summary={sources} />
        </StaggerItem>
      </StaggerIn>
    );
  }

  return (
    <StaggerIn className="grid gap-3 md:grid-cols-3" gap={0.06}>
      <StaggerItem className="md:col-span-2 md:row-span-2">
        <CallsWidget summary={activity} />
      </StaggerItem>
      <StaggerItem>
        <ErrorRateWidget summary={activity} />
      </StaggerItem>
      <StaggerItem>
        <ConnectionsWidget summary={sources} />
      </StaggerItem>
      <StaggerItem className="md:col-span-2">
        <CallsBySourceWidget items={activity.bySource} />
      </StaggerItem>
      <StaggerItem>
        <TopToolsWidget items={activity.topTools} />
      </StaggerItem>
    </StaggerIn>
  );
}
