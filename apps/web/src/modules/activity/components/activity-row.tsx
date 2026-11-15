import type { ActivityCallView } from "@runelay/shared";
import { formatNumber } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ConnectorIcon } from "@/modules/catalog/components/connector-icon";
import { AgentChip } from "./agent-chip";

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });

interface ActivityRowProps {
  call: ActivityCallView;
  icon: string | null;
  slowestMs: number;
}

export function ActivityRow({ call, icon, slowestMs }: ActivityRowProps) {
  const t = useT();
  const width = Math.max(4, Math.round((call.durationMs / Math.max(slowestMs, 1)) * 100));

  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-lg px-3 py-2.5 transition-colors duration-200 hover:bg-muted/50 sm:grid-cols-[auto_minmax(0,1.4fr)_minmax(0,1fr)_120px_64px]">
      <span className="relative flex">
        <ConnectorIcon name={call.source} icon={icon} size="sm" />
        <span
          aria-hidden
          className={cn(
            "absolute -right-0.5 -bottom-0.5 size-2 rounded-full ring-2 ring-background",
            call.ok ? "bg-success" : "bg-destructive",
          )}
        />
      </span>
      <span className="flex min-w-0 items-baseline gap-1.5 font-mono text-[12.5px]">
        <span className="shrink-0 text-muted-foreground">{call.source}.</span>
        <span className="truncate text-foreground">{call.tool}</span>
        {!call.ok && (
          <span className="shrink-0 rounded-md bg-destructive/10 px-1.5 py-px font-sans text-[10.5px] font-medium text-destructive">
            {t("activity.list.failed")}
          </span>
        )}
      </span>
      <span className="col-start-2 row-start-2 min-w-0 sm:col-start-auto sm:row-start-auto">
        {call.keyId ? (
          <AgentChip name={call.keyName ?? call.keyId} seed={call.keyId} />
        ) : (
          <AgentChip name={t("activity.filters.noAgent")} seed="none" muted />
        )}
      </span>
      <span className="hidden items-center gap-2 sm:flex">
        <span className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
          <span
            className={cn("block h-full rounded-full", call.ok ? "bg-foreground/35" : "bg-destructive/70")}
            style={{ width: `${width}%` }}
          />
        </span>
        <span className="w-14 text-right text-[12px] text-muted-foreground tabular-nums">
          {formatNumber(call.durationMs)} ms
        </span>
      </span>
      <span className="row-span-2 self-center text-right text-[12px] text-muted-foreground tabular-nums sm:row-span-1">
        {timeFormat.format(new Date(call.createdAt))}
      </span>
    </div>
  );
}
