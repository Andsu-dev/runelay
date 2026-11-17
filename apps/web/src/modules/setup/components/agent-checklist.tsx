import { File01Icon, PlugSocketIcon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence } from "motion/react";
import { Button, buttonVariants } from "@/components/ui/action/button";
import { type MessageKey, useT } from "@/lib/i18n";
import { AGENT_LOGOS, DESKTOP_RETRY_CHECKS } from "@/modules/setup/constants/setup.constants";
import type { DesktopAgentReport, DesktopDoctorCheck, DesktopSetupResult } from "@/types/runelay-desktop";
import { AgentCheckRow, type AgentCheckState } from "./agent-check-row";
import { ClientLogo } from "./client-logo";
import { ManualAgentPanel } from "./manual-agent-panel";

interface AgentChecklistProps {
  agents: DesktopAgentReport[];
  checks: DesktopDoctorCheck[];
  result: DesktopSetupResult | null;
  settled: boolean;
  connected: boolean;
  running: boolean;
  onRetry: () => void;
  onOpenPaths: (paths: string[]) => void;
}

const MEMORY_TRACKED = ["off", "on", "error"];

const isVisible = (agent: DesktopAgentReport) =>
  agent.detected && (agent.mcpSupported || MEMORY_TRACKED.includes(agent.nativeMemory));

const isHooked = (agent: DesktopAgentReport) => !agent.mcpSupported || agent.mcpRegistered;

const isMemoryOk = (agent: DesktopAgentReport) => agent.nativeMemory !== "on" && agent.nativeMemory !== "error";

const fileName = (path: string) => path.split(/[\\/]/).at(-1) ?? path;

export function AgentChecklist({
  agents,
  checks,
  result,
  settled,
  connected,
  running,
  onRetry,
  onOpenPaths,
}: AgentChecklistProps) {
  const t = useT();
  const visible = agents.filter(isVisible);
  const warnings = checks.filter(
    (check) => check.status === "warn" && (check.kind === "instructions" || DESKTOP_RETRY_CHECKS.includes(check.kind)),
  );
  const pendingLogins = result?.pendingLogins ?? [];
  const imported = result?.imported;

  const retry = (
    <Button
      variant="ghost"
      size="sm"
      className="cursor-pointer"
      onClick={onRetry}
      disabled={running}
      aria-label={t("setup.desktop.retryLabel")}
    >
      <HugeiconsIcon icon={RefreshIcon} strokeWidth={1.8} />
      {t("setup.desktop.retry")}
    </Button>
  );

  const agentDetail = (agent: DesktopAgentReport, state: AgentCheckState) => {
    if (state === "pending") return null;
    if (state === "warn" && !isHooked(agent)) return t("setup.desktop.agent.detail.notRegistered");
    if (agent.nativeMemory === "on") return t("setup.desktop.agent.detail.memoryOn");
    if (agent.nativeMemory === "error") return t("setup.desktop.agent.detail.memoryError");
    if (agent.nativeMemory === "manual") return t("setup.desktop.agent.detail.memoryManual");
    return null;
  };

  const agentRow = (agent: DesktopAgentReport) => {
    const logo = AGENT_LOGOS[agent.id] ?? null;
    const healthy = isHooked(agent) && isMemoryOk(agent);
    const state: AgentCheckState = settled ? (healthy ? "ok" : "warn") : connected && healthy ? "ok" : "pending";
    const title =
      state === "pending"
        ? t("setup.desktop.agent.pending", { agent: agent.name })
        : state === "ok"
          ? t(agent.mcpSupported ? "setup.desktop.agent.ready" : "setup.desktop.agent.memoryReady", {
              agent: agent.name,
            })
          : t(isHooked(agent) ? "setup.desktop.agent.memoryOn" : "setup.desktop.agent.notHooked", {
              agent: agent.name,
            });
    return (
      <AgentCheckRow
        key={agent.id}
        leading={<ClientLogo logo={logo} />}
        title={title}
        detail={agentDetail(agent, state)}
        state={state}
        stateLabel={t(`setup.desktop.state.${state}` as MessageKey)}
        action={state === "warn" && retry}
      />
    );
  };

  const checkRow = (check: DesktopDoctorCheck) =>
    check.kind === "instructions" ? (
      <AgentCheckRow
        key={check.kind}
        leading={<HugeiconsIcon icon={File01Icon} size={15} strokeWidth={1.7} />}
        title={t("setup.desktop.checks.instructions")}
        detail={check.paths.map(fileName).join(", ")}
        state="warn"
        stateLabel={t("setup.desktop.state.warn")}
        action={
          <Button
            variant="ghost"
            size="sm"
            className="cursor-pointer"
            onClick={() => onOpenPaths(check.paths)}
            aria-label={t("setup.desktop.openFileLabel")}
          >
            {t("setup.desktop.openFile")}
          </Button>
        }
      />
    ) : (
      <AgentCheckRow
        key={check.kind}
        leading={<HugeiconsIcon icon={RefreshIcon} size={15} strokeWidth={1.7} />}
        title={t(check.kind === "skills" ? "setup.desktop.checks.skills" : "setup.desktop.checks.leftoverMemories")}
        state="warn"
        stateLabel={t("setup.desktop.state.warn")}
        action={retry}
      />
    );

  if (settled && !running && visible.length === 0)
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[13px] font-medium text-pretty">{t("setup.desktop.noAgents")}</p>
        <ManualAgentPanel />
      </div>
    );

  return (
    <div className="flex flex-col gap-2">
      <ul aria-live="polite" aria-busy={running} className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {visible.map(agentRow)}
          {settled && warnings.map(checkRow)}
          {settled && pendingLogins.length > 0 && (
            <AgentCheckRow
              key="pending-logins"
              leading={<HugeiconsIcon icon={PlugSocketIcon} size={15} strokeWidth={1.7} />}
              title={t("setup.desktop.pendingLogins", { count: pendingLogins.length })}
              detail={pendingLogins.join(", ")}
              state="warn"
              stateLabel={t("setup.desktop.state.warn")}
              action={
                <Link
                  to="/connectors/reconnect"
                  className={buttonVariants({ variant: "ghost", size: "sm", className: "cursor-pointer" })}
                >
                  {t("setup.desktop.signIn")}
                </Link>
              }
            />
          )}
        </AnimatePresence>
      </ul>
      {settled && imported && imported.memories + imported.skills > 0 && (
        <p className="px-1 text-xs text-muted-foreground">
          {t("setup.desktop.imported", { memories: imported.memories, skills: imported.skills })}
        </p>
      )}
      {settled && !running && <ManualAgentPanel />}
    </div>
  );
}
