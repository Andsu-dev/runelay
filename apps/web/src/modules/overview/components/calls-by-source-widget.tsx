import { PlugSocketIcon } from "@hugeicons/core-free-icons";
import type { RankedCountView } from "@runelay/shared";
import { RankedBarRow } from "./ranked-bar-row";
import { WidgetCard } from "./widget-card";

interface CallsBySourceWidgetProps {
  items: RankedCountView[];
}

export function CallsBySourceWidget({ items }: CallsBySourceWidgetProps) {
  return (
    <WidgetCard icon={PlugSocketIcon} title="Chamadas por conexão">
      {items.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">Nenhuma conexão foi chamada no período.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <RankedBarRow key={item.name} item={item} />
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
