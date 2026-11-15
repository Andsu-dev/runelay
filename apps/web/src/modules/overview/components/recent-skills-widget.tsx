import { BookOpen01Icon } from "@hugeicons/core-free-icons";
import type { RecentUsageView } from "@runelay/shared";
import { formatNumber } from "@/lib/format";
import { RecentUsageRow } from "./recent-usage-row";
import { WidgetCard } from "./widget-card";

interface RecentSkillsWidgetProps {
  items: RecentUsageView[];
  total: number;
}

export function RecentSkillsWidget({ items, total }: RecentSkillsWidgetProps) {
  const peak = Math.max(0, ...items.map((item) => item.calls));

  return (
    <WidgetCard
      icon={BookOpen01Icon}
      title="Skills recentes"
      meta={total > 0 ? `${formatNumber(total)} leituras` : undefined}
    >
      {items.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">Nenhuma skill foi lida no período.</p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {items.map((item) => (
            <RecentUsageRow key={item.name} item={item} icon={BookOpen01Icon} color="var(--chart-2)" peak={peak} />
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
