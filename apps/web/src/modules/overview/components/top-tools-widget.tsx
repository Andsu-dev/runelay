import { Wrench01Icon } from "@hugeicons/core-free-icons";
import type { RankedCountView } from "@runelay/shared";
import { useQuery } from "@tanstack/react-query";
import { formatNumber } from "@/lib/format";
import { ConnectorIcon } from "@/modules/catalog/components/connector-icon";
import { sourcesQuery } from "@/modules/sources/api/sources.api";
import { WidgetCard } from "./widget-card";

interface TopToolsWidgetProps {
  items: RankedCountView[];
}

export function TopToolsWidget({ items }: TopToolsWidgetProps) {
  const { data: sources } = useQuery(sourcesQuery);
  const iconOf = (name: string) => sources?.find((source) => source.name === name)?.icon ?? null;

  return (
    <WidgetCard icon={Wrench01Icon} title="Tools mais usadas">
      {items.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">Nenhuma tool foi chamada no período.</p>
      ) : (
        <ol className="flex flex-col gap-0.5">
          {items.map((item, index) => {
            const source = item.name.split(".")[0] ?? item.name;
            return (
              <li key={item.name} className="flex min-h-8 items-center gap-3 text-[13px]">
                <span className="w-4 shrink-0 text-right text-[12px] text-muted-foreground tabular-nums">
                  {index + 1}
                </span>
                <ConnectorIcon name={source} icon={iconOf(source)} size="sm" />
                <span className="min-w-0 flex-1 truncate font-mono text-[12px]">{item.name}</span>
                <span className="font-medium tabular-nums">{formatNumber(item.calls)}</span>
              </li>
            );
          })}
        </ol>
      )}
    </WidgetCard>
  );
}
