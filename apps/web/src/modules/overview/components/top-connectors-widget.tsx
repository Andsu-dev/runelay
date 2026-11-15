import { PlugSocketIcon } from "@hugeicons/core-free-icons";
import type { RankedCountView } from "@runelay/shared";
import { useQuery } from "@tanstack/react-query";
import { ConnectorIcon } from "@/modules/catalog/components/connector-icon";
import { sourcesQuery } from "@/modules/sources/api/sources.api";
import { RankedBarRow } from "./ranked-bar-row";
import { WidgetCard } from "./widget-card";

interface TopConnectorsWidgetProps {
  items: RankedCountView[];
}

export function TopConnectorsWidget({ items }: TopConnectorsWidgetProps) {
  const { data: sources } = useQuery(sourcesQuery);
  const iconOf = (name: string) => sources?.find((source) => source.name === name)?.icon ?? null;

  return (
    <WidgetCard icon={PlugSocketIcon} title="Top conectores">
      {items.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">Nenhum conector foi chamado no período.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <RankedBarRow
              key={item.name}
              item={item}
              leading={<ConnectorIcon name={item.name} icon={iconOf(item.name)} size="sm" />}
            />
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
