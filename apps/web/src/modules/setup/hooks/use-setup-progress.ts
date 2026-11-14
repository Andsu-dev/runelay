import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { onboardingQuery } from "@/modules/onboarding/api/onboarding.api";
import { SETUP_STEPS } from "@/modules/setup/constants/setup.constants";
import { addSetupMark, useSetupMarks } from "@/modules/setup/stores/setup-marks.store";
import type { SetupStepId, SetupStepState } from "@/modules/setup/types/setup.types";

export const useSetupProgress = (organizationId: string, extraDone: Partial<Record<SetupStepId, boolean>> = {}) => {
  const { data: onboarding } = useQuery(onboardingQuery);
  const marked = useSetupMarks(organizationId);
  const [openId, setOpenId] = useState<SetupStepId | null>(null);

  const isDone = (id: SetupStepId) =>
    marked.includes(id) ||
    Boolean(extraDone[id]) ||
    Boolean(onboarding?.steps.some((step) => step.id === id && step.done));

  const steps: SetupStepState[] = SETUP_STEPS.map((step, index) => {
    const previous = SETUP_STEPS[index - 1];
    return {
      ...step,
      index: index + 1,
      done: isDone(step.id),
      reachable: !previous || isDone(previous.id) || isDone(step.id),
    };
  });

  const currentStep = steps.find((step) => !step.done) ?? null;
  const activeId = openId ?? currentStep?.id ?? null;
  const completed = steps.filter((step) => step.done).length;

  const markDone = (id: SetupStepId) => {
    addSetupMark(organizationId, id);
    setOpenId(null);
  };

  const toggle = (id: SetupStepId) => setOpenId(id === activeId ? null : id);

  return {
    steps,
    activeId,
    currentStep,
    markDone,
    toggle,
    completed,
    total: steps.length,
    finished: completed === steps.length,
    loaded: Boolean(onboarding),
  };
};
