import type { SourceStatus } from "@runelay/shared";
import { Tooltip } from "@/components/ui/overlay/tooltip";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { STATUS_DOT, STATUS_LABEL } from "@/modules/sources/constants/source.constants";

interface ConnectorStatusDotProps {
  status: SourceStatus;
}

export function ConnectorStatusDot({ status }: ConnectorStatusDotProps) {
  const t = useT();
  return (
    <Tooltip content={t(STATUS_LABEL[status])} hideArrow>
      <span
        role="img"
        aria-label={t(STATUS_LABEL[status])}
        className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOT[status])}
      />
    </Tooltip>
  );
}
