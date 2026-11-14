import { createFileRoute } from "@tanstack/react-router";
import { ListSkeleton } from "@/components/ui/display/list-skeleton";
import { RouteError } from "@/components/ui/display/route-error";
import { ReconnectQueue } from "@/modules/reconnect/components/reconnect-queue";
import { needsAuthQuery } from "@/modules/sources/api/sources.api";

export const Route = createFileRoute("/_app/connectors/reconnect")({
  loader: ({ context }) => context.queryClient.ensureQueryData(needsAuthQuery),
  pendingComponent: ListSkeleton,
  errorComponent: RouteError,
  component: ReconnectQueue,
});
