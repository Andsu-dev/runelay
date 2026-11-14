import { createFileRoute, redirect } from "@tanstack/react-router";
import { onboardingQuery } from "@/modules/onboarding/api/onboarding.api";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    const onboarding = await context.queryClient.fetchQuery(onboardingQuery).catch(() => null);
    const pendingSetup = onboarding !== null && onboarding.completed < onboarding.total;
    throw redirect({ to: pendingSetup ? "/setup" : "/overview" });
  },
});
