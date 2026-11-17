import { ok, type Result } from "@runelay/shared";
import { cliEnv } from "@/config/env";
import { printJson, wantsJson } from "@/lib/json-output";
import { accent, truncate, terminalColumns } from "@/lib/terminal";
import { formatNote, printCard, type Step, startStep, toneMark } from "@/lib/ui";
import { buildAgentReports, toCheckReport } from "@/services/agent-report.service";
import { runDoctor } from "@/services/doctor.service";
import type { DoctorCheck } from "@/types/doctor.types";
import type { DoctorReport } from "@/types/json-report.types";

const TONES = { ok: "ok", warn: "warn", info: "skip" } as const;

const tildify = (text: string) => (cliEnv.RUNELAY_HOME ? text.replaceAll(cliEnv.RUNELAY_HOME, "~") : text);

export const doctorLines = (checks: DoctorCheck[], width = terminalColumns()) =>
  checks.flatMap(({ status, label, details, fix }) => [
    truncate(`  ${toneMark(TONES[status])} ${tildify(label)}`, width),
    ...details.map((detail) => formatNote(tildify(detail), width)),
    ...(fix ? [truncate(`    ${accent(`fix: ${fix}`)}`, width)] : []),
  ]);

export const countWarnings = (checks: DoctorCheck[]) => checks.filter((check) => check.status === "warn").length;

export const printDoctorChecks = (checks: DoctorCheck[], step?: Step) => {
  for (const line of doctorLines(checks)) step ? step.row(line) : console.log(line);
  return countWarnings(checks);
};

export const checkSetup = ({ verbose = true }: { verbose?: boolean } = {}) => {
  const step = startStep("Checking runelay on this computer");
  const checks = runDoctor();
  const warnings = printDoctorChecks(verbose ? checks : checks.filter(({ status }) => status !== "info"), step);
  const passed = checks.filter((check) => check.status === "ok").length;
  if (warnings) step.warn(`${passed} ok · ${warnings} ${warnings === 1 ? "warning" : "warnings"}`);
  else step.done(`${passed} ok`);
  return { checks, warnings, passed };
};

export const doctorCommand = async (args: string[] = []): Promise<Result<null>> => {
  const { checks, warnings, passed } = checkSetup();
  if (wantsJson(args))
    printJson({
      command: "doctor",
      ok: warnings === 0,
      warnings,
      agents: buildAgentReports(),
      checks: checks.map(toCheckReport),
    } satisfies DoctorReport);
  const firstFix = checks.find((check) => check.status === "warn" && check.fix)?.fix;
  printCard({
    title: warnings ? "Needs attention" : "All good",
    stats: [
      ["Checks", `${passed} ok · ${warnings} ${warnings === 1 ? "warning" : "warnings"} · ${checks.length - passed - warnings} notes`],
    ],
    next: warnings ? (firstFix ?? "fix the warnings above, then run runelay doctor again") : "nothing to do",
  });
  if (warnings) process.exitCode = 1;
  return ok(null);
};
