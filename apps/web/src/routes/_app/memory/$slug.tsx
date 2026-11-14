import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ListSkeleton } from "@/components/ui/display/list-skeleton";
import { RouteError } from "@/components/ui/display/route-error";
import { memoryQuery } from "@/modules/memory/api/memories.api";
import { MemoryDetail } from "@/modules/memory/components/memory-detail";

export const Route = createFileRoute("/_app/memory/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(memoryQuery(params.slug)),
  pendingComponent: ListSkeleton,
  errorComponent: RouteError,
  component: MemoryPage,
});

function MemoryPage() {
  const { slug } = Route.useParams();
  const { data: memory } = useSuspenseQuery(memoryQuery(slug));
  return <MemoryDetail memory={memory} />;
}
