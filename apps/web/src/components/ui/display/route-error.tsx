import { Alert02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { translateError, useT } from "@/lib/i18n";

export function RouteError({ error }: ErrorComponentProps) {
  const t = useT();

  return (
    <div className="flex items-start gap-3 rounded-xl bg-card p-5 text-sm">
      <HugeiconsIcon icon={Alert02Icon} size={18} strokeWidth={1.6} className="mt-0.5 shrink-0 text-destructive" />
      <div className="flex flex-col gap-0.5">
        <p className="font-medium">{t("layout.ui.routeErrorTitle")}</p>
        <p className="text-[13px] text-muted-foreground">{translateError(error, t("common.actions.tryAgain"))}</p>
      </div>
    </div>
  );
}
