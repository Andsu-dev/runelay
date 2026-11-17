import { createFileRoute, redirect } from "@tanstack/react-router";
import { apiKeysQuery } from "@/modules/api-keys/api/api-keys.api";
import { meQuery } from "@/modules/auth/api/session.api";
import { onboardingQuery } from "@/modules/onboarding/api/onboarding.api";
import { readSetupMarks } from "@/modules/setup/stores/setup-marks.store";
import { usedAgents } from "@/modules/setup/utils/agent-presence";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    const [me, onboarding, apiKeys] = await Promise.all([
      context.queryClient.fetchQuery(meQuery).catch(() => null),
      context.queryClient.fetchQuery(onboardingQuery).catch(() => null),
      context.queryClient.fetchQuery(apiKeysQuery).catch(() => null),
    ]);
    const agentsReady =
      Boolean(onboarding?.steps.some((step) => step.id === "agent" && step.done)) ||
      usedAgents(apiKeys ?? undefined).length > 0 ||
      (me !== null && readSetupMarks(me.organization.id).includes("agents"));
    throw redirect({ to: me && onboarding && !agentsReady ? "/setup" : "/overview" });
  },
});
