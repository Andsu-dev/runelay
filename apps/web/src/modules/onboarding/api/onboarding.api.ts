import type { OnboardingView } from "@runeley/shared";
import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export const onboardingQuery = queryOptions({
  queryKey: ["onboarding"],
  queryFn: () => api.get<OnboardingView>("/onboarding"),
});
