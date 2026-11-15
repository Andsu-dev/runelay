import { ArrowDownRight01Icon, ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { formatPercent } from "@/lib/format";
import { useT } from "@/lib/i18n";

interface DeltaBadgeProps {
  changePercent: number | null;
}

export function DeltaBadge({ changePercent }: DeltaBadgeProps) {
  const t = useT();
  if (changePercent === null) return null;
  const up = changePercent >= 0;

  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full bg-foreground/5 px-1.5 py-0.5 text-[12px] font-medium text-muted-foreground tabular-nums"
      title={t("overview.delta.tooltip")}
    >
      <HugeiconsIcon icon={up ? ArrowUpRight01Icon : ArrowDownRight01Icon} size={13} strokeWidth={2} />
      {formatPercent(Math.abs(changePercent) / 100)}
    </span>
  );
}
