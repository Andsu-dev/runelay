import type { CatalogConnectorView } from "@runelay/shared";
import { useT } from "@/lib/i18n";
import { FEATURED_PITCH } from "@/modules/catalog/constants/catalog.constants";
import { CatalogItemActions } from "./catalog-item-actions";
import { ConnectorIcon } from "./connector-icon";
import { ConnectorStatusDot } from "./connector-status-dot";

interface FeaturedConnectorCardProps {
  connector: CatalogConnectorView;
}

export function FeaturedConnectorCard({ connector }: FeaturedConnectorCardProps) {
  const t = useT();
  const pitch = FEATURED_PITCH[connector.id];

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-muted/50 p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <ConnectorIcon name={connector.name} icon={connector.icon} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-center gap-2">
            <span className="truncate text-[15px] font-semibold">{connector.name}</span>
            <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
              {t("catalog.featured.label")}
            </span>
            {connector.status && <ConnectorStatusDot status={connector.status} />}
          </span>
          <span className="text-pretty text-[13px] text-muted-foreground">
            {pitch ? t(pitch) : connector.description}
          </span>
        </div>
      </div>
      <div className="flex justify-end">
        <CatalogItemActions connector={connector} prominent />
      </div>
    </div>
  );
}
