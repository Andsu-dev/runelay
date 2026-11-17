import { ok, type Result } from "@runelay/shared";
import { cliEnv } from "@/config/env";
import { plural, shortPath } from "@/lib/format";
import { dim } from "@/lib/terminal";
import { formatRow, printCard, startStep } from "@/lib/ui";
import { writeBriefs } from "@/services/brief-writer.service";
import { resolveConnection } from "@/services/config.service";
import { fetchBrief } from "@/services/runelay-api.service";
import { materializeSkills } from "@/services/skill-materializer.service";
import type { Connection } from "@/types/config.types";
import type { SkillPullOutcome } from "@/types/skill-pull.types";

export const writeInstructionBriefs = async (connection: Connection) => {
  const step = startStep("Writing the runelay rule to your agents");
  const outcomes = await writeBriefs((client) => fetchBrief(connection, client));
  const home = cliEnv.RUNELAY_HOME;
  for (const { target, status, message, pinnedCount } of outcomes) {
    const file = shortPath(target.file, home);
    if (status === "skipped") continue;
    if (status === "failed") step.row(formatRow({ tone: "error", name: target.name, message: message ?? "failed" }));
    else
      step.row(
        formatRow({
          tone: status === "written" ? "ok" : "skip",
          name: target.name,
          message: `${file} ${status === "written" ? "updated" : "already up to date"} ${dim(`· ${plural(pinnedCount, "pinned rule", "pinned rules")}`)}`,
        }),
      );
  }
  const written = outcomes.filter(({ status }) => status === "written").length;
  const current = outcomes.filter(({ status }) => status === "written" || status === "unchanged").length;
  const failed = outcomes.filter(({ status }) => status === "failed").length;
  if (failed) {
    process.exitCode = 1;
    step.warn(`${current} up to date, ${failed} failed`);
  } else if (!current) step.skip("no agent with a global instructions file");
  else step.done(`${plural(current, "agent", "agents")} · ${written} updated`);
  return { written, current, failed };
};

const OUTCOME_LABELS: Record<SkillPullOutcome, string> = {
  created: "new",
  updated: "updated",
  unchanged: "unchanged",
  local: "already local",
  failed: "failed",
};

const pullSkills = async (connection: Connection) => {
  const step = startStep("Fetching skills");
  const pulled = await materializeSkills(connection);
  if (pulled.error) {
    process.exitCode = 1;
    step.fail(pulled.error.message);
    return { counts: new Map<SkillPullOutcome, number>(), failed: 1 };
  }
  const counts = new Map<SkillPullOutcome, number>();
  for (const result of pulled.data) counts.set(result.outcome, (counts.get(result.outcome) ?? 0) + 1);
  const summary = [...counts].map(([outcome, total]) => `${total} ${OUTCOME_LABELS[outcome]}`).join(" · ");
  const failures = pulled.data.filter((result) => result.outcome === "failed");
  for (const failed of failures)
    step.row(formatRow({ tone: "error", name: failed.slug, message: failed.message ?? "failed" }));
  if (failures.length) {
    process.exitCode = 1;
    step.warn(summary);
  } else step.done(summary || "no active skills on the server");
  return { counts, failed: failures.length };
};

export const describeSkillCounts = (counts: Map<SkillPullOutcome, number>) =>
  (["created", "updated", "unchanged"] as const).map((outcome) => `${counts.get(outcome) ?? 0} ${OUTCOME_LABELS[outcome]}`).join(" · ");

export const runPull = async (connection: Connection) => {
  const briefs = await writeInstructionBriefs(connection);
  const skills = await pullSkills(connection);
  return { files: briefs.current, counts: skills.counts, warnings: briefs.failed + skills.failed };
};

export const pullCommand = async (): Promise<Result<null>> => {
  const connection = resolveConnection();
  if (connection.error) return connection;
  const pulled = await runPull(connection.data);
  printCard({
    title: "Pulled",
    stats: [
      ["Instructions", `${plural(pulled.files, "agent", "agents")} with the runelay rule`],
      ["Skills", describeSkillCounts(pulled.counts)],
      ["Warnings", String(pulled.warnings)],
    ],
    next: "runelay doctor",
  });
  return ok(null);
};
