import { Login01Icon, PlugSocketIcon, Store01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { Button, buttonVariants } from "@/components/ui/action/button";
import { type MessageKey, useT } from "@/lib/i18n";
import { meQuery } from "@/modules/auth/api/session.api";
import { TIMELINE_EASE } from "@/modules/setup/constants/setup.constants";
import { useAgentSetup } from "@/modules/setup/hooks/use-agent-setup";
import { useSetupProgress } from "@/modules/setup/hooks/use-setup-progress";
import type { RunelayDesktopBridge } from "@/types/runelay-desktop";
import { AgentChecklist } from "./agent-checklist";
import { SetupDone } from "./setup-done";
import { SetupErrorNotice } from "./setup-error-notice";
import { SetupProgress } from "./setup-progress";
import { TimelineNode } from "./timeline-node";

interface DesktopSetupProps {
  bridge: RunelayDesktopBridge;
}

interface DesktopSetupCardProps {
  index: number;
  done: boolean;
  active: boolean;
  title: string;
  description: string;
  children: ReactNode;
}

function DesktopSetupCard({ index, done, active, title, description, children }: DesktopSetupCardProps) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, ease: TIMELINE_EASE, delay: index * 0.08 }}
      className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-4 rounded-xl bg-panel p-5"
    >
      <TimelineNode index={index} done={done} active={active} reachable />
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
          <p className="max-w-prose text-[13px] text-pretty text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
    </motion.li>
  );
}

export function DesktopSetup({ bridge }: DesktopSetupProps) {
  const t = useT();
  const { data: me } = useSuspenseQuery(meQuery);
  const organizationId = me.organization.id;
  const { isDone, markDone, completed, total, finished, reloginCount, agentNames } = useSetupProgress(organizationId);
  const { progress, running, error, run, recheck, openPaths } = useAgentSetup(bridge, organizationId);
  const agentsDone = isDone("agents");
  const accountsDone = isDone("accounts");
  const migratedSources = progress.result?.imported?.sources ?? 0;
  const accountsDescription =
    migratedSources > 0
      ? t.plural("setup.desktop.accounts.afterMigrate", migratedSources)
      : t("setup.desktop.accounts.description");
  const accountsAction = t(
    reloginCount > 0
      ? "setup.relogin"
      : migratedSources > 0
        ? "setup.desktop.accounts.actionMissing"
        : "setup.desktop.accounts.action",
  );
  const accountsClassName = buttonVariants({
    size: "lg",
    variant: agentsDone && !accountsDone ? "default" : "glass",
    className: "cursor-pointer",
  });
  const showChecklist = running || (progress.settled && (!error || progress.agents.length > 0));
  const loadingText = progress.step
    ? t(`setup.desktop.steps.${progress.step}` as MessageKey)
    : t("setup.desktop.steps.preparing");

  return (
    <div className="flex flex-col gap-6">
      <SetupProgress completed={completed} total={total} />
      {finished && <SetupDone agents={agentNames} />}
      <ol className="flex flex-col gap-3">
        <DesktopSetupCard
          index={1}
          done={agentsDone}
          active={!agentsDone}
          title={t("setup.desktop.agents.title")}
          description={t(agentsDone ? "setup.desktop.agents.doneDescription" : "setup.desktop.agents.description")}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="lg"
              variant={agentsDone ? "glass" : "default"}
              className="cursor-pointer"
              onClick={agentsDone ? recheck : run}
              loading={running}
              loadingText={loadingText}
              aria-label={t(agentsDone ? "setup.desktop.agents.recheck" : "setup.desktop.agents.action")}
            >
              <HugeiconsIcon icon={PlugSocketIcon} strokeWidth={1.7} />
              {t(agentsDone ? "setup.desktop.agents.recheck" : "setup.desktop.agents.action")}
            </Button>
          </div>
          {error && !running && <SetupErrorNotice error={error} onRetry={run} />}
          {showChecklist && (
            <AgentChecklist
              agents={progress.agents}
              checks={progress.checks}
              result={progress.result}
              settled={progress.settled}
              connected={progress.connected}
              running={running}
              onRetry={run}
              onOpenPaths={openPaths}
            />
          )}
        </DesktopSetupCard>

        <DesktopSetupCard
          index={2}
          done={accountsDone}
          active={agentsDone && !accountsDone}
          title={t("setup.desktop.accounts.title")}
          description={accountsDescription}
        >
          <div className="flex flex-wrap items-center gap-2">
            {reloginCount > 0 ? (
              <Link to="/connectors/reconnect" aria-label={accountsAction} className={accountsClassName}>
                <HugeiconsIcon icon={Login01Icon} strokeWidth={1.7} />
                {accountsAction}
              </Link>
            ) : (
              <Link
                to="/connectors"
                search={{ tab: "catalog" }}
                aria-label={accountsAction}
                className={accountsClassName}
              >
                <HugeiconsIcon icon={Store01Icon} strokeWidth={1.7} />
                {accountsAction}
              </Link>
            )}
            {!accountsDone && (
              <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => markDone("accounts")}>
                {t("setup.desktop.accounts.skip")}
              </Button>
            )}
          </div>
        </DesktopSetupCard>
      </ol>
    </div>
  );
}
