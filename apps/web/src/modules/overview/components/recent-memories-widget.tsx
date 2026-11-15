import { Brain02Icon } from "@hugeicons/core-free-icons";
import type { RecentUsageView } from "@runelay/shared";
import { formatNumber } from "@/lib/format";
import { RecentUsageRow } from "./recent-usage-row";
import { WidgetCard } from "./widget-card";

interface RecentMemoriesWidgetProps {
  items: RecentUsageView[];
  total: number;
}

export function RecentMemoriesWidget({ items, total }: RecentMemoriesWidgetProps) {
  const peak = Math.max(0, ...items.map((item) => item.calls));

  return (
    <WidgetCard
      icon={Brain02Icon}
      title="Memórias recentes"
      meta={total > 0 ? `${formatNumber(total)} acessos` : undefined}
    >
      {items.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">Nenhuma memória foi usada no período.</p>
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
