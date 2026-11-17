import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ApiError } from "@/lib/api-client";
import { apiKeysQuery, createApiKey } from "@/modules/api-keys/api/api-keys.api";
import { unwrapBridge } from "@/modules/settings/api/desktop-server.api";
import { desktopStartupQuery } from "@/modules/settings/api/desktop-startup.api";
import { DESKTOP_AUTO_STEPS, DESKTOP_KEY_NAME } from "@/modules/setup/constants/setup.constants";
import { addSetupMark } from "@/modules/setup/stores/setup-marks.store";
import type {
  DesktopAgentReport,
  DesktopDoctorCheck,
  DesktopSetupEvent,
  DesktopSetupResult,
  DesktopSetupStep,
  RunelayDesktopBridge,
} from "@/types/runelay-desktop";

interface AgentSetupProgress {
  step: DesktopSetupStep | null;
  agents: DesktopAgentReport[];
  settled: boolean;
  connected: boolean;
  checks: DesktopDoctorCheck[];
  result: DesktopSetupResult | null;
}

export interface DesktopSetupFailure {
  code: string | null;
  message: string;
}

class DesktopSetupError extends Error {
  readonly code: string | null;

  constructor(code: string | null, message = "") {
    super(message);
    this.code = code;
  }
}

const toFailure = (error: Error | null): DesktopSetupFailure | null =>
  error && {
    code: error instanceof DesktopSetupError || error instanceof ApiError ? error.code : null,
    message: error.message,
  };

const IDLE: AgentSetupProgress = { step: null, agents: [], settled: false, connected: false, checks: [], result: null };

const ensureAgentKey = async (bridge: RunelayDesktopBridge) => {
  const status = await bridge.agentKeyStatus?.();
  if (status?.ready || !bridge.saveAgentKey) return false;
  const created = await createApiKey({ name: DESKTOP_KEY_NAME });
  await unwrapBridge(bridge.saveAgentKey(created.key));
  return true;
};

const unwrapSetup = (result: DesktopSetupResult) => {
  if (result.error) throw new DesktopSetupError(result.errorCode ?? result.code, result.error);
  return result;
};

export const useAgentSetup = (bridge: RunelayDesktopBridge, organizationId: string) => {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<AgentSetupProgress>(IDLE);

  const onProgress = (event: DesktopSetupEvent) =>
    setProgress((current) =>
      event.type === "agents"
        ? { ...current, agents: event.agents }
        : {
            ...current,
            step: event.status === "running" ? event.step : current.step,
            connected: current.connected || (event.step === "connect" && event.status !== "running"),
          },
    );

  const setup = useMutation({
    mutationFn: async () => {
      if (!bridge.setupAgents) throw new DesktopSetupError("unsupported");
      setProgress(IDLE);
      if (await ensureAgentKey(bridge)) await queryClient.invalidateQueries({ queryKey: apiKeysQuery.queryKey });
      return unwrapSetup(await bridge.setupAgents(onProgress));
    },
    onSuccess: (result) => {
      setProgress((current) => ({
        ...current,
        step: null,
        settled: true,
        agents: result.agents ?? current.agents,
        checks: result.checks ?? [],
        result,
      }));
      for (const id of DESKTOP_AUTO_STEPS) addSetupMark(organizationId, id);
      queryClient.invalidateQueries({ queryKey: desktopStartupQuery(bridge).queryKey });
    },
    onError: () => setProgress((current) => ({ ...current, step: null, settled: true })),
  });

  const check = useMutation({
    mutationFn: async () => {
      if (!bridge.doctor) throw new DesktopSetupError("unsupported");
      const report = await bridge.doctor();
      if (report.code === "missing_key") return null;
      if (report.error) throw new DesktopSetupError(report.errorCode ?? report.code, report.error);
      return report;
    },
    onSuccess: (report) => {
      if (!report) return setup.mutate();
      setProgress({ ...IDLE, settled: true, agents: report.agents, checks: report.checks });
    },
  });

  const openPaths = async (paths: string[]) => {
    for (const path of paths) await bridge.openPath?.(path);
  };

  return {
    progress,
    running: setup.isPending || check.isPending,
    error: toFailure(setup.error ?? check.error),
    run: () => setup.mutate(),
    recheck: () => check.mutate(),
    openPaths,
  };
};
