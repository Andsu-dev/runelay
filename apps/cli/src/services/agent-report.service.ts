import { existsSync, readFileSync } from "node:fs";
import { cliEnv } from "@/config/env";
import { manualMemoryStepsFor, nativeMemoryTargetsFor } from "@/constants/agent-memory.constants";
import { agentSpecsFor } from "@/constants/agent-report.constants";
import { TOML_RUNELAY_HEADER } from "@/constants/clients.constants";
import { mcpTargetsFor } from "@/constants/mcp-targets.constants";
import { isMcpTargetInstalled, readMcpRegistration } from "@/services/mcp-registration.service";
import { inspectNativeMemory, installedManualSteps } from "@/services/native-memory.service";
import type { DoctorCheck } from "@/types/doctor.types";
import type {
  AgentReport,
  AgentReportInput,
  AgentSpec,
  DoctorCheckReport,
  NativeMemoryState,
} from "@/types/json-report.types";
import type { McpRegistration } from "@/types/mcp-target.types";

export const defaultAgentReportInput = (): AgentReportInput => ({
  home: cliEnv.RUNELAY_HOME,
  which: (command) => Bun.which(command),
  dirs: { configHome: cliEnv.XDG_CONFIG_HOME, kimiHome: cliEnv.KIMI_CODE_HOME },
});

const readRegistration = ({ mcpFile, mcpFormat }: AgentSpec): McpRegistration => {
  if (!mcpFile || !existsSync(mcpFile)) return { registered: false, message: null };
  try {
    const content = readFileSync(mcpFile, "utf8");
    if (mcpFormat === "toml")
      return { registered: content.split("\n").some((line) => line.trim() === TOML_RUNELAY_HEADER), message: null };
    const parsed = (content.trim() ? JSON.parse(content) : {}) as { mcpServers?: Record<string, unknown> };
    return { registered: Boolean(parsed.mcpServers?.runelay), message: null };
  } catch (error) {
    return { registered: false, message: `Couldn't read ${mcpFile}: ${(error as Error).message}` };
  }
};

const readNativeMemory = (spec: AgentSpec, home: string): { state: NativeMemoryState; message: string | null } => {
  const target = nativeMemoryTargetsFor(home).find((candidate) => candidate.agent === spec.name);
  if (target) {
    const [outcome] = inspectNativeMemory([target]);
    if (!outcome) return { state: "n/a", message: null };
    if (outcome.result.error) return { state: "error", message: outcome.result.error.message };
    return { state: outcome.result.data.length ? "on" : "off", message: null };
  }
  const manual = installedManualSteps(manualMemoryStepsFor(home)).find((step) => step.agent === spec.name);
  return manual ? { state: "manual", message: manual.step } : { state: "n/a", message: null };
};

const reportAgent = (spec: AgentSpec, { home, which, dirs }: AgentReportInput): AgentReport => {
  const target = mcpTargetsFor(home, dirs).find((candidate) => candidate.id === spec.id);
  const binary = spec.command ? which(spec.command) : null;
  const detected =
    spec.detect.some((path) => existsSync(path)) ||
    Boolean(binary) ||
    Boolean(target && isMcpTargetInstalled(target, which));
  const mcpSupported = Boolean(spec.mcpFile || target);
  const registration = target ? readMcpRegistration(target) : readRegistration(spec);
  const memory = detected ? readNativeMemory(spec, home) : { state: "n/a" as const, message: null };
  const missingCommand =
    detected && spec.command && !binary && !registration.registered
      ? `Couldn't find the ${spec.command} command on this computer.`
      : null;
  return {
    id: spec.id,
    name: spec.name,
    detected,
    mcpSupported,
    mcpRegistered: registration.registered,
    nativeMemory: memory.state,
    message: registration.message ?? missingCommand ?? memory.message,
    keyName: null,
  };
};

export const buildAgentReports = (input = defaultAgentReportInput()): AgentReport[] =>
  agentSpecsFor(input.home).map((spec) => reportAgent(spec, input));

export const toCheckReport = ({ kind, status, label, details, fix, paths }: DoctorCheck): DoctorCheckReport => ({
  kind: kind ?? "other",
  status,
  label,
  details,
  fix: fix ?? null,
  paths: paths ?? [],
});
