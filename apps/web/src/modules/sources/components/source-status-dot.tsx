import type { SourceStatus } from "@runeley/shared";
import { cn } from "@/lib/utils";
import { STATUS_DOT, STATUS_LABEL } from "@/modules/sources/constants/source.constants";

interface SourceStatusDotProps {
  status: SourceStatus;
  enabled: boolean;
}

export function SourceStatusDot({ status, enabled }: SourceStatusDotProps) {
  return (
    <span
      role="img"
      aria-label={enabled ? STATUS_LABEL[status] : "Pausada"}
      className={cn("size-2 shrink-0 rounded-full", enabled ? STATUS_DOT[status] : "bg-muted-foreground/30")}
    />
  );
}
