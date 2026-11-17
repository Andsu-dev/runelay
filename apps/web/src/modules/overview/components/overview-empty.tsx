import { Key01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@/components/ui/action/button";
import { useT } from "@/lib/i18n";
import { apiKeysQuery } from "@/modules/api-keys/api/api-keys.api";
import { namedAgents, usedAgents } from "@/modules/setup/utils/agent-presence";

export function OverviewEmpty() {
  const t = useT();
  const { data: apiKeys } = useQuery(apiKeysQuery);
  const liveAgents = usedAgents(apiKeys);
  const live = liveAgents.length > 0;

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-xl bg-background px-6 py-8 text-center shadow-xs">
      <HugeiconsIcon icon={Key01Icon} size={22} strokeWidth={1.5} className="text-muted-foreground" />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold">{t("overview.empty.title")}</p>
        <p className="text-[13px] text-pretty text-muted-foreground">
          {live
            ? t.plural("overview.empty.live", liveAgents.length, { agents: namedAgents(t, liveAgents) })
            : t("overview.empty.description")}
        </p>
      </div>
      {!live && (
        <Link to="/api-keys" className={buttonVariants({ size: "sm" })}>
          {t("overview.empty.action")}
        </Link>
      )}
    </div>
  );
}
