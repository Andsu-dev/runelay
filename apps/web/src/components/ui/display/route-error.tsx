import { Alert02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ErrorComponentProps } from "@tanstack/react-router";

export function RouteError({ error }: ErrorComponentProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-card p-5 text-sm">
      <HugeiconsIcon icon={Alert02Icon} size={18} strokeWidth={1.6} className="mt-0.5 shrink-0 text-destructive" />
      <div className="flex flex-col gap-0.5">
        <p className="font-medium">Não deu para carregar esta página.</p>
        <p className="text-[13px] text-muted-foreground">{error instanceof Error ? error.message : "Tente de novo."}</p>
      </div>
    </div>
  );
}
