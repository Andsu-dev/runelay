import { Brain02Icon } from "@hugeicons/core-free-icons";
import type { RecentUsageView } from "@runelay/shared";
import { useT } from "@/lib/i18n";
import { RecentUsageRow } from "./recent-usage-row";
import { WidgetCard } from "./widget-card";

interface RecentMemoriesWidgetProps {
  items: RecentUsageView[];
  total: number;
}

export function RecentMemoriesWidget({ items, total }: RecentMemoriesWidgetProps) {
  const t = useT();
  const peak = Math.max(0, ...items.map((item) => item.calls));

  return (
    <WidgetCard
      icon={Brain02Icon}
      title={t("overview.recentMemories.title")}
      meta={total > 0 ? t.plural("overview.recentMemories.accesses", total) : undefined}
    >
      {items.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">{t("overview.recentMemories.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {items.map((item) => (
            <RecentUsageRow key={item.name} item={item} icon={Brain02Icon} color="var(--chart-3)" peak={peak} />
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
