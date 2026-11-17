import { Login01Icon, Store01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/action/button";
import { CommandBlock } from "@/components/ui/display/command-block";
import { useT } from "@/lib/i18n";
import { apiKeysQuery } from "@/modules/api-keys/api/api-keys.api";
import { meQuery } from "@/modules/auth/api/session.api";
import { StartupCard } from "@/modules/settings/components/startup-card";
import { SETUP_COMMAND } from "@/modules/setup/constants/setup.constants";
import { useSetupProgress } from "@/modules/setup/hooks/use-setup-progress";
import type { SetupStepId } from "@/modules/setup/types/setup.types";
import { agentPresence, presenceSummary } from "@/modules/setup/utils/agent-presence";
import { sourcesSummaryQuery } from "@/modules/sources/api/sources.api";
import { AdvancedAgentSetup } from "./advanced-agent-setup";
import { AgentPresenceList } from "./agent-presence-list";
import { DesktopSetup } from "./desktop-setup";
import { SetupDone } from "./setup-done";
import { SetupProgress } from "./setup-progress";
import { TimelineStep } from "./timeline-step";

export function SetupGuide() {
  const bridge = window.runelayDesktop;
  if (bridge?.setupAgents) return <DesktopSetup bridge={bridge} />;
  return <BrowserSetupGuide />;
}

function BrowserSetupGuide() {
  const t = useT();
  const { data: me } = useSuspenseQuery(meQuery);
  const { steps, activeId, markDone, toggle, keepOpen, reloginCount, agentNames, completed, total, finished } =
    useSetupProgress(me.organization.id);
  const bridge = window.runelayDesktop;
  const { data: sourcesSummary } = useQuery(sourcesSummaryQuery);
  const connectedSources = sourcesSummary?.total ?? 0;
  const { data: apiKeys } = useQuery(apiKeysQuery);
  const agentsSummary = presenceSummary(t, agentPresence(apiKeys));

  const content: Record<SetupStepId, { body?: ReactNode; action?: ReactNode }> = {
    desktop: {
      body: bridge && <StartupCard bridge={bridge} onToggle={() => keepOpen("desktop")} />,
    },
    agents: {
      body: (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium">{t("setup.agents.commandLabel")}</span>
            <CommandBlock value={SETUP_COMMAND(window.location.origin)} label={t("setup.agents.copyCommand")} />
            <span className="text-xs text-pretty text-muted-foreground">{t("setup.agents.commandCaption")}</span>
          </div>
          <AgentPresenceList />
          <AdvancedAgentSetup />
        </div>
      ),
    },
    accounts: {
      body:
        reloginCount > 0 ? (
          <p className="flex max-w-prose items-center gap-2 text-[13px] text-pretty text-foreground">
            <span className="size-2 shrink-0 rounded-full bg-warning" />
            {t.plural("setup.reloginPending", reloginCount)}
          </p>
        ) : (
          connectedSources > 0 && (
            <p className="max-w-prose text-[13px] text-pretty text-muted-foreground">
              {t.plural("setup.sourcesConnected", connectedSources)}
            </p>
          )
        ),
      action: (
        <>
          {reloginCount > 0 && (
            <Link to="/connectors/reconnect" className={buttonVariants({ size: "sm" })}>
              <HugeiconsIcon icon={Login01Icon} strokeWidth={1.6} />
              {t("setup.relogin")}
            </Link>
          )}
          <Link
            to="/connectors"
            search={{ tab: "catalog" }}
            className={buttonVariants({ variant: reloginCount > 0 ? "glass" : "default", size: "sm" })}
          >
            <HugeiconsIcon icon={Store01Icon} strokeWidth={1.6} />
            {t("setup.openCatalog")}
          </Link>
        </>
      ),
    },
  };

  return (
    <div className="flex flex-col gap-6">
      <SetupProgress completed={completed} total={total} />
      {finished && <SetupDone agents={agentNames} />}
      <ol className="flex flex-col">
        {steps.map((step, index) => (
          <TimelineStep
            key={step.id}
            step={step}
            open={activeId === step.id}
            last={index === steps.length - 1}
            onToggle={() => toggle(step.id)}
            onSkip={() => markDone(step.id)}
            summary={step.id === "agents" ? agentsSummary : undefined}
            body={content[step.id].body}
            action={content[step.id].action}
          />
        ))}
      </ol>
    </div>
  );
}
