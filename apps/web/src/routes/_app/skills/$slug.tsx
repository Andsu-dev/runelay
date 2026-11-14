import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ListSkeleton } from "@/components/ui/display/list-skeleton";
import { RouteError } from "@/components/ui/display/route-error";
import { skillQuery } from "@/modules/skills/api/skills.api";
import { SkillDetail } from "@/modules/skills/components/skill-detail";

export const Route = createFileRoute("/_app/skills/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(skillQuery(params.slug)),
  pendingComponent: ListSkeleton,
  errorComponent: RouteError,
  component: SkillPage,
});

function SkillPage() {
  const { slug } = Route.useParams();
  const { data: skill } = useSuspenseQuery(skillQuery(slug));
  return <SkillDetail skill={skill} />;
}
