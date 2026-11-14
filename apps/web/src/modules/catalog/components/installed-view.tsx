import { useQuery } from "@tanstack/react-query";
import { ListSkeleton } from "@/components/ui/display/list-skeleton";
import { ReconnectBanner } from "@/modules/reconnect/components/reconnect-banner";
import { sourcesQuery } from "@/modules/sources/api/sources.api";
import { SourceList } from "@/modules/sources/components/source-list";

export function InstalledView() {
  const { data: sources } = useQuery(sourcesQuery);
  if (!sources) return <ListSkeleton />;
  return (
    <div className="flex flex-col gap-3">
      <ReconnectBanner />
      <SourceList sources={sources} />
    </div>
  );
}
