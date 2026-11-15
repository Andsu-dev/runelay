import { BookOpen01Icon } from "@hugeicons/core-free-icons";
import type { RecentUsageView } from "@runelay/shared";
import { useT } from "@/lib/i18n";
import { RecentUsageRow } from "./recent-usage-row";
import { WidgetCard } from "./widget-card";

interface RecentSkillsWidgetProps {
  items: RecentUsageView[];
  total: number;
}

export function RecentSkillsWidget({ items, total }: RecentSkillsWidgetProps) {
  const t = useT();
  const peak = Math.max(0, ...items.map((item) => item.calls));

  return (
    <WidgetCard
      icon={BookOpen01Icon}
      title={t("overview.recentSkills.title")}
      meta={total > 0 ? t.plural("overview.recentSkills.reads", total) : undefined}
    >
      {items.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">{t("overview.recentSkills.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-0.5 max-h-80 overflow-y-auto overscroll-contain -mr-2 pr-2 [scrollbar-width:thin]">
          {items.map((item) => (
            <RecentUsageRow key={item.name} item={item} icon={BookOpen01Icon} color="var(--chart-2)" peak={peak} />
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
