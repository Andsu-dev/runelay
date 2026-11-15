import type { SourceStatus } from "@runelay/shared";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { STATUS_DOT, STATUS_LABEL } from "@/modules/sources/constants/source.constants";

interface SourceStatusDotProps {
  status: SourceStatus;
  enabled: boolean;
}

export function SourceStatusDot({ status, enabled }: SourceStatusDotProps) {
  const t = useT();

  return (
    <span
      role="img"
      aria-label={enabled ? t(STATUS_LABEL[status]) : t("sources.status.paused")}
      className={cn("size-2 shrink-0 rounded-full", enabled ? STATUS_DOT[status] : "bg-muted-foreground/30")}
    />
  );
}
