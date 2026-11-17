import type { ApiKeyView } from "@runelay/shared";
import { formatList } from "@/lib/format";
import type { Translator } from "@/lib/i18n/translate";
import { CLIENT_SNIPPETS } from "@/modules/api-keys/constants/client-snippets.constants";
import { AGENT_KEY_SEPARATOR } from "@/modules/setup/constants/setup.constants";
import type { AgentPresence } from "@/modules/setup/types/setup.types";

const KNOWN_AGENTS = new Set<string>(CLIENT_SNIPPETS.map((snippet) => snippet.client));

const agentOf = (name: string | null) => {
  if (!name) return null;
  const [agent, host] = name.split(AGENT_KEY_SEPARATOR);
  if (host && agent) return agent.trim();
  return KNOWN_AGENTS.has(name) ? name : null;
};

export const agentPresence = (keys: ApiKeyView[] | undefined): AgentPresence[] => {
  const agents = new Map<string, boolean>();
  for (const key of keys ?? []) {
    const agent = agentOf(key.name);
    if (agent) agents.set(agent, Boolean(agents.get(agent)) || key.lastRequest !== null);
  }
  return [...agents]
    .map(([name, used]) => ({ name, used }))
    .sort((left, right) => Number(right.used) - Number(left.used) || left.name.localeCompare(right.name));
};

export const usedAgents = (keys: ApiKeyView[] | undefined) =>
  agentPresence(keys)
    .filter((agent) => agent.used)
    .map((agent) => agent.name);

export const namedAgents = (t: Translator, names: string[]) => {
  const joined = formatList(names.map((agent) => t("setup.agents.named", { agent })));
  return joined.charAt(0).toUpperCase() + joined.slice(1);
};

export const presenceSummary = (t: Translator, agents: AgentPresence[]) => {
  const live = agents.filter((agent) => agent.used).map((agent) => agent.name);
  const pending = agents.filter((agent) => !agent.used).map((agent) => agent.name);
  return [
    live.length > 0 && t.plural("setup.steps.agents.live", live.length, { agents: formatList(live) }),
    pending.length > 0 && t.plural("setup.steps.agents.pending", pending.length, { agents: namedAgents(t, pending) }),
  ]
    .filter(Boolean)
    .join(" ");
};
