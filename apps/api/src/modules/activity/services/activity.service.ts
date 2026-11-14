import { type OnboardingView, ok, type Result } from "@runelay/shared";
import { ONBOARDING_STEPS } from "@/modules/activity/constants/activity.constants";
import { findOnboardingProgress } from "@/modules/activity/repositories/activity.repository";

export { summarizeActivity } from "@/modules/activity/repositories/activity.repository";

export const describeOnboarding = (organizationId: string): Result<OnboardingView> => {
  const progress = findOnboardingProgress(organizationId);
  if (progress.error) return progress;
  const steps = ONBOARDING_STEPS.map((step) => ({ ...step, done: progress.data?.[step.id] === 1 }));
  return ok({ steps, completed: progress.data?.completed ?? 0, total: steps.length });
};
