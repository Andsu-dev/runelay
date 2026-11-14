import type { AuditEventView } from "@runeley/shared";
import { cn } from "@/lib/utils";

interface KeyActivityRowProps {
  event: AuditEventView;
}

const TIME_FORMAT = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" });

export function KeyActivityRow({ event }: KeyActivityRowProps) {
  return (
    <li className="flex items-center gap-3 py-2 text-[13px]">
      <span className={cn("size-1.5 shrink-0 rounded-full", event.ok ? "bg-success" : "bg-destructive")} />
      <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground uppercase">
        {event.kind === "tool" ? "tool" : "api"}
      </span>
      <span className="min-w-0 flex-1 truncate font-mono text-xs">{event.action}</span>
      {event.durationMs !== null && (
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{event.durationMs} ms</span>
      )}
      {event.ip && <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{event.ip}</span>}
      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
        {TIME_FORMAT.format(new Date(event.createdAt))}
      </span>
    </li>
  );
}
