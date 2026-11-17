import type { SourceStatus } from "@runelay/shared";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { STATUS_DOT, STATUS_LABEL } from "@/modules/sources/constants/source.constants";

interface SourceStatusDotProps {
  status: SourceStatus;
  enabled: boolean;
  local?: boolean;
}

export function SourceStatusDot({ status, enabled, local = false }: SourceStatusDotProps) {
  const t = useT();

  return (
    <span
      role="img"
      aria-label={
        !enabled ? t("sources.status.paused") : local ? t("sources.status.agentLocal") : t(STATUS_LABEL[status])
      }
      className={cn(
        "size-2 shrink-0 rounded-full",
        enabled && !local ? STATUS_DOT[status] : "bg-muted-foreground/30",
      )}
    />
  );
}
