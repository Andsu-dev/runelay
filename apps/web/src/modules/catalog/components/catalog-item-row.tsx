import type { CatalogConnectorView } from "@runelay/shared";
import { CatalogItemActions } from "./catalog-item-actions";
import { ConnectorIcon } from "./connector-icon";
import { ConnectorStatusDot } from "./connector-status-dot";

interface CatalogItemRowProps {
  connector: CatalogConnectorView;
}

export function CatalogItemRow({ connector }: CatalogItemRowProps) {
  return (
    <div className="flex min-h-16 items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200 hover:bg-muted/50">
      <ConnectorIcon name={connector.name} icon={connector.icon} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-2">
          <span className="truncate text-[13px] font-semibold">{connector.name}</span>
          {connector.status && <ConnectorStatusDot status={connector.status} />}
        </span>
        <span className="line-clamp-1 text-[12px] text-muted-foreground">{connector.description}</span>
      </div>
      <CatalogItemActions connector={connector} />
    </div>
  );
}
