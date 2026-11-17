import { ok, type Result } from "@runelay/shared";
import { countWarnings } from "@/commands/doctor.command";
import { cliEnv } from "@/config/env";
import { CONFIG_FILE } from "@/constants/cli.constants";
import { maskKey, plural, relativeTime, shortPath } from "@/lib/format";
import { dim, glyphs, green, hyperlink, yellow } from "@/lib/terminal";
import { printCard, startStep } from "@/lib/ui";
import { buildAgentReports } from "@/services/agent-report.service";
import { resolveConnection } from "@/services/config.service";
import { runDoctor } from "@/services/doctor.service";
import { readLastPush } from "@/services/push-state.service";
import { fetchStatus } from "@/services/runelay-api.service";

export const statusCommand = async (): Promise<Result<null>> => {
  const connection = resolveConnection();
  if (connection.error) return connection;
  const { url, apiKey, fromEnv } = connection.data;
  const step = startStep(`Asking ${url}`);
  const status = await fetchStatus(connection.data);
  if (status.error) {
    step.fail(status.error.message);
    return status;
  }
  step.done("online");
  const { organizationName, sources, memories, skills } = status.data;
  const agents = buildAgentReports().filter((agent) => agent.detected && agent.mcpSupported);
  const connected = agents.filter((agent) => agent.mcpRegistered).length;
  const checks = runDoctor();
  const warnings = countWarnings(checks);
  const lastPush = readLastPush();
  const next =
    checks.find((check) => check.status === "warn" && check.fix)?.fix ??
    (connected < agents.length ? "runelay connect" : !lastPush ? "runelay push" : "runelay open");
  printCard({
    title: organizationName,
    stats: [
      ["Server", hyperlink(url, url)],
      [
        "Key",
        `${maskKey(apiKey)} ${dim(`${glyphs.meta} ${fromEnv ? "from RUNELAY_API_KEY" : shortPath(CONFIG_FILE, cliEnv.RUNELAY_HOME)}`)}`,
      ],
      [
        "Stored",
        `${plural(sources, "connection", "connections")} · ${plural(memories, "memory", "memories")} · ${plural(skills, "skill", "skills")}`,
      ],
      ["Last push", lastPush ? relativeTime(lastPush) : "never"],
      ["Agents", `${connected} of ${agents.length} use runelay`],
      [
        "Doctor",
        warnings ? yellow(`${glyphs.warn} ${plural(warnings, "warning", "warnings")}`) : green(`${glyphs.ok} all good`),
      ],
    ],
    next,
  });
  return ok(null);
};
