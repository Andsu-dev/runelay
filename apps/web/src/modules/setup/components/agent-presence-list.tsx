import { useQuery } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";
import { useT } from "@/lib/i18n";
import { AGENT_LOGO_MATCHERS } from "@/modules/activity/constants/agent-logos.constants";
import { apiKeysQuery } from "@/modules/api-keys/api/api-keys.api";
import { AGENT_POLL_MS } from "@/modules/setup/constants/setup.constants";
import { agentPresence } from "@/modules/setup/utils/agent-presence";
import { AgentCheckRow } from "./agent-check-row";
import { ClientLogo } from "./client-logo";

const CURSOR_AGENT = "Cursor";

const logoOf = (name: string) => AGENT_LOGO_MATCHERS.find(({ pattern }) => pattern.test(name))?.logo ?? null;

export function AgentPresenceList() {
  const t = useT();
  const { data: apiKeys } = useQuery({ ...apiKeysQuery, refetchInterval: AGENT_POLL_MS });
  const agents = agentPresence(apiKeys);
  const waiting = !agents.some((agent) => agent.used);

  return (
    <ul aria-live="polite" className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {waiting && (
          <AgentCheckRow
            key="waiting"
            leading={<ClientLogo logo={null} />}
            title={t("setup.agents.waiting")}
            detail={t("setup.agents.waitingHint")}
            state="pending"
            stateLabel={t("setup.desktop.state.pending")}
          />
        )}
        {agents.map((agent) => (
          <AgentCheckRow
            key={agent.name}
            leading={<ClientLogo logo={logoOf(agent.name)} />}
            title={t(agent.used ? "setup.agents.using" : "setup.agents.notYet", { agent: agent.name })}
            detail={
              !agent.used
                ? t("setup.agents.notYetHint", { agent: agent.name })
                : agent.name === CURSOR_AGENT
                  ? t("setup.agents.cursorRules")
                  : null
            }
            state={agent.used ? "ok" : "pending"}
            stateLabel={t(agent.used ? "setup.desktop.state.ok" : "setup.desktop.state.pending")}
          />
        ))}
      </AnimatePresence>
    </ul>
  );
}
