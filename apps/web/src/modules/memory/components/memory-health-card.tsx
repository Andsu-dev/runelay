import { Activity01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/display/skeleton";
import { formatDate } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { memoryHealthQuery } from "@/modules/memory/api/memories.api";
import { HEALTH_DAYS } from "@/modules/memory/constants/memory.constants";
import { HealthGroup } from "./health-group";
import { HealthLinkItem } from "./health-link-item";

export function MemoryHealthCard() {
  const t = useT();
  const { data: health } = useQuery(memoryHealthQuery(HEALTH_DAYS));

  return (
    <section className="flex flex-col gap-2 rounded-xl bg-muted/60 p-1 dark:bg-card">
      <header className="flex min-h-9 items-center gap-2 px-2.5 text-[12px] font-medium text-muted-foreground">
        <HugeiconsIcon icon={Activity01Icon} size={14} strokeWidth={1.7} />
        <h2 className="flex-1">{t("memory.health.title")}</h2>
        {health && <span className="tabular-nums">{t("memory.health.total", { count: health.total })}</span>}
      </header>
      <div className="flex flex-col rounded-lg bg-background p-1.5 shadow-xs dark:bg-muted/40">
        {health ? (
          <div className="flex flex-col">
            <HealthGroup
              label={t("memory.health.stale", { days: health.staleDays })}
              count={health.stale.length}
              tone="warning"
            >
              {health.stale.map((memory) => (
                <HealthLinkItem key={memory.slug} slug={memory.slug} meta={formatDate(memory.updatedAt)}>
                  {memory.name}
                </HealthLinkItem>
              ))}
            </HealthGroup>
            <HealthGroup label={t("memory.health.brokenLinks")} count={health.brokenLinks.length} tone="destructive">
              {health.brokenLinks.map((link) => (
                <HealthLinkItem key={`${link.from}:${link.to}`} slug={link.from} meta={`[[${link.to}]]`}>
                  {link.from}
                </HealthLinkItem>
              ))}
            </HealthGroup>
            <HealthGroup label={t("memory.health.isolated")} count={health.isolated.length}>
              {health.isolated.map((memory) => (
                <HealthLinkItem key={memory.slug} slug={memory.slug}>
                  {memory.name}
                </HealthLinkItem>
              ))}
            </HealthGroup>
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-2" aria-busy="true">
            <Skeleton className="h-5" />
            <Skeleton className="h-5" />
            <Skeleton className="h-5" />
          </div>
        )}
      </div>
    </section>
  );
}
