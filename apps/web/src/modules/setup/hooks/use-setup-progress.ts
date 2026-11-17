import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { apiKeysQuery } from "@/modules/api-keys/api/api-keys.api";
import { onboardingQuery } from "@/modules/onboarding/api/onboarding.api";
import { desktopStartupQuery } from "@/modules/settings/api/desktop-startup.api";
import { DESKTOP_VARIANT_STEPS, SETUP_STEPS } from "@/modules/setup/constants/setup.constants";
import { addSetupMark, useSetupMarks } from "@/modules/setup/stores/setup-marks.store";
import type { SetupStepId, SetupStepState } from "@/modules/setup/types/setup.types";
import { usedAgents } from "@/modules/setup/utils/agent-presence";
import { needsAuthQuery } from "@/modules/sources/api/sources.api";

const CHAINED_STEPS = SETUP_STEPS.filter((step) => step.id !== "desktop");

export const useSetupProgress = (organizationId: string) => {
  const { data: onboarding } = useQuery(onboardingQuery);
  const { data: apiKeys, isPending: keysPending } = useQuery(apiKeysQuery);
  const bridge = window.runelayDesktop;
  const { data: startup, isPending: startupPending } = useQuery(desktopStartupQuery(bridge));
  const startupLoaded = !bridge?.getStartup || !startupPending;
  const visibleSteps = bridge?.setupAgents
    ? SETUP_STEPS.filter((step) => DESKTOP_VARIANT_STEPS.includes(step.id))
    : startup?.supported && startup.local !== false
      ? SETUP_STEPS
      : CHAINED_STEPS;
  const { data: needsAuth } = useQuery(needsAuthQuery);
  const reloginCount = needsAuth?.length ?? 0;
  const marked = useSetupMarks(organizationId);
  const [openId, setOpenId] = useState<SetupStepId | null>(null);
  const agentNames = usedAgents(apiKeys);

  const onboardingDone = (id: string) => Boolean(onboarding?.steps.some((step) => step.id === id && step.done));

  const isDone = (id: SetupStepId) => {
    if (marked.includes(id)) return true;
    if (id === "desktop") return Boolean(startup?.openAtLogin);
    if (id === "agents") return agentNames.length > 0 || onboardingDone("agent");
    return onboardingDone("source") && reloginCount === 0;
  };

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
  const loaded = Boolean(onboarding) && startupLoaded && !keysPending;
  const [seenCurrentId, setSeenCurrentId] = useState<SetupStepId | null | undefined>(undefined);
  if (loaded && seenCurrentId !== (currentStep?.id ?? null)) {
    setSeenCurrentId(currentStep?.id ?? null);
    if (seenCurrentId === "agents" && openId === null && agentNames.length > 0 && !marked.includes("agents")) {
      setOpenId("agents");
    }
  }
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
    reloginCount,
    agentNames,
    isDone,
    completed,
    total: steps.length,
    finished: completed === steps.length,
    loaded,
  };
};
