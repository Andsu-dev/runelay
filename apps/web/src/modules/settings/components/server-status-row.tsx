import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/display/skeleton";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { versionQuery } from "@/modules/system/api/system.api";
import { SettingsRow } from "./settings-row";

export function ServerStatusRow() {
  const { data: version, isError } = useQuery(versionQuery);
  const t = useT();

  const description = version
    ? version.updateAvailable && version.latest
      ? t("settings.server.versionWithUpdate", { current: version.current, latest: version.latest })
      : t("settings.server.version", { current: version.current })
    : isError
      ? t("settings.server.noResponse")
      : undefined;

  return (
    <SettingsRow label={t("settings.server.status")} description={description}>
      {version || isError ? (
        <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <span aria-hidden className={cn("size-2 rounded-full", version ? "bg-success" : "bg-destructive")} />
          {version ? t("settings.server.online") : t("settings.server.offline")}
        </span>
      ) : (
        <Skeleton className="h-4 w-16" />
      )}
    </SettingsRow>
  );
}
