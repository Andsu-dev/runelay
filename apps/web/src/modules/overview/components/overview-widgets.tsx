import type { ActivitySummaryView, SourcesSummaryView } from "@runelay/shared";
import { StaggerIn } from "@/components/layout/stagger-in";
import { StaggerItem } from "@/components/layout/stagger-item";
import { CallsWidget } from "./calls-widget";
import { ConnectionsWidget } from "./connections-widget";
import { DailyActivityWidget } from "./daily-activity-widget";
import { ErrorRateWidget } from "./error-rate-widget";
import { RecentMemoriesWidget } from "./recent-memories-widget";
import { RecentSkillsWidget } from "./recent-skills-widget";
import { TopConnectorsWidget } from "./top-connectors-widget";
import { TopToolsWidget } from "./top-tools-widget";
import { UsageByKindWidget } from "./usage-by-kind-widget";

interface OverviewWidgetsProps {
  activity: ActivitySummaryView;
  sources: SourcesSummaryView;
}

export function OverviewWidgets({ activity, sources }: OverviewWidgetsProps) {
  const kindCalls = (name: string) => activity.byKind.find((kind) => kind.name === name)?.calls ?? 0;

  return (
    <StaggerIn className="grid gap-3 *:min-w-0 md:grid-cols-3" gap={0.06}>
      <StaggerItem>
        <CallsWidget summary={activity} />
      </StaggerItem>
      <StaggerItem>
        <ErrorRateWidget summary={activity} />
      </StaggerItem>
      <StaggerItem>
        <ConnectionsWidget summary={sources} />
      </StaggerItem>
      <StaggerItem className="md:col-span-3">
        <DailyActivityWidget daily={activity.daily} />
      </StaggerItem>
      <StaggerItem>
        <UsageByKindWidget items={activity.byKind} />
      </StaggerItem>
      <StaggerItem>
        <TopConnectorsWidget items={activity.bySource} />
      </StaggerItem>
      <StaggerItem>
        <RecentSkillsWidget items={activity.recentSkills} total={kindCalls("skills")} />
      </StaggerItem>
      <StaggerItem className="md:col-span-2">
        <TopToolsWidget items={activity.topTools} />
      </StaggerItem>
      <StaggerItem>
        <RecentMemoriesWidget items={activity.recentMemories} total={kindCalls("memories")} />
      </StaggerItem>
    </StaggerIn>
  );
}
