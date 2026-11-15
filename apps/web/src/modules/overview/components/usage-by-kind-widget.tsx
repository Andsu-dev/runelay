import { PieChartIcon } from "@hugeicons/core-free-icons";
import type { RankedCountView } from "@runelay/shared";
import { formatCompact, formatPercent } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { USAGE_KINDS } from "@/modules/overview/constants/overview.constants";
import { HalfDonutGauge } from "./half-donut-gauge";
import { LegendItem } from "./legend-item";
import { RollingText } from "./rolling-text";
import { WidgetCard } from "./widget-card";

interface UsageByKindWidgetProps {
  items: RankedCountView[];
}

export function UsageByKindWidget({ items }: UsageByKindWidgetProps) {
  const t = useT();
  const kinds = items.flatMap((item) => {
    const kind = USAGE_KINDS[item.name];
    return kind ? [{ ...item, ...kind }] : [];
  });
  const total = kinds.reduce((sum, kind) => sum + kind.calls, 0);

  return (
    <WidgetCard icon={PieChartIcon} title={t("overview.usageByKind.title")}>
      <HalfDonutGauge
        label={t("overview.usageByKind.gauge")}
        segments={kinds.map((kind) => ({
          key: kind.name,
          share: kind.share,
          color: kind.color,
          tooltip: (
            <span className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1.5 text-[13px] font-semibold">
                <span className="size-2 rounded-full" style={{ backgroundColor: kind.color }} />
                {t(kind.label)}
              </span>
              <span className="text-background/70 tabular-nums">
                {t("overview.usageByKind.callsShare", { calls: kind.calls, share: formatPercent(kind.share) })}
              </span>
            </span>
          ),
        }))}
      >
        <RollingText value={formatCompact(total)} className="text-2xl font-semibold tracking-[-0.03em] tabular-nums" />
        <span className="text-[12px] text-muted-foreground">{t("overview.usageByKind.callsUnit")}</span>
      </HalfDonutGauge>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
        {kinds.map((kind) => (
          <li key={kind.name}>
            <LegendItem color={kind.color} label={t(kind.label)} value={formatPercent(kind.share)} />
          </li>
        ))}
      </ul>
    </WidgetCard>
  );
}
