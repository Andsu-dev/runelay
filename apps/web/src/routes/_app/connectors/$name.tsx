import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ListSkeleton } from "@/components/ui/display/list-skeleton";
import { RouteError } from "@/components/ui/display/route-error";
import { sourceQuery } from "@/modules/sources/api/sources.api";
import { SourceDetail } from "@/modules/sources/components/source-detail";

export const Route = createFileRoute("/_app/connectors/$name")({
  validateSearch: z.object({ oauth_error: z.string().optional() }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(sourceQuery(params.name)),
  pendingComponent: ListSkeleton,
  errorComponent: RouteError,
  component: ConnectorPage,
});

function ConnectorPage() {
  const { name } = Route.useParams();
  const { oauth_error: oauthError } = Route.useSearch();
  const { data: source } = useSuspenseQuery(sourceQuery(name));
  return <SourceDetail source={source} oauthError={oauthError} />;
}
