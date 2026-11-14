import { useQuery } from "@tanstack/react-query";
import { ListSkeleton } from "@/components/ui/display/list-skeleton";
import { sourcesQuery } from "@/modules/sources/api/sources.api";
import { SourceList } from "@/modules/sources/components/source-list";

export function InstalledView() {
  const { data: sources } = useQuery(sourcesQuery);
  if (!sources) return <ListSkeleton />;
  return <SourceList sources={sources} />;
}
