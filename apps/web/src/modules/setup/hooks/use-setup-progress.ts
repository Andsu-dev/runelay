import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { onboardingQuery } from "@/modules/onboarding/api/onboarding.api";
import { desktopStartupQuery } from "@/modules/settings/api/desktop-startup.api";
import { SETUP_STEPS } from "@/modules/setup/constants/setup.constants";
import { addSetupMark, useSetupMarks } from "@/modules/setup/stores/setup-marks.store";
import type { SetupStepId, SetupStepState } from "@/modules/setup/types/setup.types";

const CHAINED_STEPS = SETUP_STEPS.filter((step) => step.id !== "desktop");

export const useSetupProgress = (organizationId: string, extraDone: Partial<Record<SetupStepId, boolean>> = {}) => {
  const { data: onboarding } = useQuery(onboardingQuery);
  const bridge = window.runelayDesktop;
  const { data: startup, isPending: startupPending } = useQuery(desktopStartupQuery(bridge));
  const startupLoaded = !bridge?.getStartup || !startupPending;
  const visibleSteps = startup?.supported ? SETUP_STEPS : CHAINED_STEPS;
  const marked = useSetupMarks(organizationId);
  const [openId, setOpenId] = useState<SetupStepId | null>(null);

  const isDone = (id: SetupStepId) =>
    marked.includes(id) ||
    Boolean(extraDone[id]) ||
    (id === "desktop" && Boolean(startup?.openAtLogin)) ||
    Boolean(onboarding?.steps.some((step) => step.id === id && step.done));

  const steps: SetupStepState[] = visibleSteps.map((step, index) => {
    const position = CHAINED_STEPS.findIndex((chained) => chained.id === step.id);
    const previous = position > 0 ? CHAINED_STEPS[position - 1] : null;
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

  const keepOpen = (id: SetupStepId) => setOpenId(id);

  return {
    steps,
    activeId,
    currentStep,
    markDone,
    toggle,
    keepOpen,
    completed,
    total: steps.length,
    finished: completed === steps.length,
    loaded: Boolean(onboarding) && startupLoaded,
  };
};
