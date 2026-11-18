import { ok, type Result } from "@runelay/shared";
import { countWarnings } from "@/commands/doctor.command";
import { COMMAND_GROUPS, COMMAND_GUIDE, type GuideName } from "@/constants/cli.constants";
import { PRIMARY_COMMANDS } from "@/constants/commands.constants";
import { printBanner } from "@/lib/banner";
import { plural, relativeTime } from "@/lib/format";
import { renderHelp } from "@/lib/help";
import { type MenuItem, runMenu } from "@/lib/menu";
import { accent, ask, bold, dim, glyphs, green, hyperlink, mark, yellow } from "@/lib/terminal";
import { buildAgentReports } from "@/services/agent-report.service";
import { readStoredConfig, resolveConnection } from "@/services/config.service";
import { runDoctor } from "@/services/doctor.service";
import { readLastPush } from "@/services/push-state.service";

export const SETUP_ID = "setup";

export const QUIT_ID = "quit";

export interface HomeSnapshot {
  connected: boolean;
  url: string | null;
  organization: string | null;
  agents: number;
  agentsMissing: number;
  warnings: number;
  lastPush: number | null;
}

export const takeSnapshot = (): HomeSnapshot => {
  const connection = resolveConnection();
  const agents = buildAgentReports().filter((agent) => agent.detected && agent.mcpSupported);
  return {
    connected: !connection.error,
    url: connection.data?.url ?? null,
    organization: readStoredConfig().data?.organizationName || null,
    agents: agents.length,
    agentsMissing: agents.filter((agent) => !agent.mcpRegistered).length,
    warnings: countWarnings(runDoctor()),
    lastPush: readLastPush(),
  };
};

export const statusLine = ({ connected, url, organization }: HomeSnapshot) =>
  connected && url
    ? `  ${mark.ok} Connected${organization ? ` to ${bold(organization)}` : ""} ${dim(glyphs.meta)} ${dim(hyperlink(url, url))}`
    : `  ${mark.warn} Not connected ${dim(`${glyphs.meta} choose ${SETUP_ID} below`)}`;

const stateBadge = (id: string, snapshot: HomeSnapshot) => {
  const { connected, agentsMissing, agents, warnings, lastPush } = snapshot;
  if (id === SETUP_ID) return connected && !agentsMissing && !warnings ? green(`${glyphs.ok} set up`) : "";
  if (id === "login") return connected ? green(`${glyphs.ok} signed in`) : "";
  if (!connected) return "";
  if (id === "connect")
    return agentsMissing
      ? yellow(`${glyphs.warn} ${plural(agentsMissing, "agent", "agents")} without runelay`)
      : green(`${glyphs.ok} ${plural(agents, "agent", "agents")}`);
  if (id === "doctor")
    return warnings
      ? yellow(`${glyphs.warn} ${plural(warnings, "warning", "warnings")}`)
      : green(`${glyphs.ok} all good`);
  if (id === "push") return lastPush ? dim(relativeTime(lastPush)) : yellow(`${glyphs.warn} never pushed`);
  return "";
};

const badgeFor = (id: string, snapshot: HomeSnapshot, recommended: string) =>
  [stateBadge(id, snapshot), id === recommended ? accent(`${glyphs.bullet} recommended`) : ""]
    .filter(Boolean)
    .join(" ");

export const recommendedItem = ({ connected, agentsMissing, warnings, lastPush }: HomeSnapshot) => {
  if (!connected) return SETUP_ID;
  if (agentsMissing) return "connect";
  if (!lastPush) return "push";
  if (warnings) return "doctor";
  return "sync";
};

export const buildMenuItems = (snapshot: HomeSnapshot): MenuItem[] => {
  const recommended = recommendedItem(snapshot);
  const commands = COMMAND_GROUPS.flatMap(({ title, commands: names }) =>
    names.map((name): MenuItem => ({ id: name, label: name, summary: COMMAND_GUIDE[name].summary, group: title })),
  );
  const quit: MenuItem = { id: QUIT_ID, label: QUIT_ID, summary: "" };
  return [...commands, quit].map((item) => ({ ...item, badge: badgeFor(item.id, snapshot, recommended) }));
};

export const homeCommand = async (version: string): Promise<Result<null>> => {
  await printBanner(version);
  const snapshot = takeSnapshot();
  console.log(`${statusLine(snapshot)}\n`);
  const items = buildMenuItems(snapshot);
  const recommended = recommendedItem(snapshot);
  const chosen = await runMenu(
    items,
    Math.max(
      0,
      items.findIndex((item) => item.id === recommended),
    ),
  );
  if (!chosen || chosen.id === QUIT_ID) return ok(null);
  console.log(`${accent(glyphs.pointer)} ${bold(chosen.label)}\n`);
  if (chosen.id === "help") {
    console.log(renderHelp());
    return ok(null);
  }
  if (chosen.id === "skills") {
    const source = await ask("GitHub repository, skills.sh link or local file");
    return source ? PRIMARY_COMMANDS.skills(["add", source]) : ok(null);
  }
  return PRIMARY_COMMANDS[chosen.id as Exclude<GuideName, "help">]([]);
};
