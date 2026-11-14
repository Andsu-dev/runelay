import type { SourceStatus } from "@runelay/shared";
import { Tooltip } from "@/components/ui/overlay/tooltip";
import { cn } from "@/lib/utils";
import { STATUS_DOT, STATUS_LABEL } from "@/modules/sources/constants/source.constants";

interface ConnectorStatusDotProps {
  status: SourceStatus;
}

export function ConnectorStatusDot({ status }: ConnectorStatusDotProps) {
  return (
    <Tooltip content={STATUS_LABEL[status]} hideArrow>
      <span
        role="img"
        aria-label={STATUS_LABEL[status]}
        className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOT[status])}
      />
    </Tooltip>
  );
}
