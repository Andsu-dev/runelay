import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { MANUAL_MEMORY_STEPS, NATIVE_MEMORY_TARGETS } from "@/constants/agent-memory.constants";
import { SKILL_MARKER_FILE } from "@/constants/cli.constants";
import {
  CLIENT_AGENT_LABELS,
  CLIENT_CONFIG_FILES,
  type ClientId,
  TOML_HEADER_KEYS,
  TOML_RUNELAY_HEADER,
} from "@/constants/clients.constants";
import {
  CLAUDE_PROJECTS_DIR,
  CONTEXT_END_MARKER,
  CONTEXT_START_MARKER,
  EXTRA_MEMORY_SOURCES,
  INSTRUCTION_SOURCES,
  MANUAL_INSTRUCTION_STEPS,
  SKILL_ENTRY_FILE,
  SKILL_SOURCES,
  SKIPPED_DIRECTORIES,
} from "@/constants/context.constants";
import {
  BLOCK_START_PATTERN,
  CONNECTED_CLIENTS,
  LOCAL_MEMORY_PATTERNS,
  NEGATION_PATTERN,
} from "@/constants/doctor.constants";
import { MCP_TARGETS } from "@/constants/mcp-targets.constants";
import { listMemoryDirectories } from "@/services/context-reader.service";
import { readMcpRegistration } from "@/services/mcp-registration.service";
import { inspectNativeMemory, installedManualSteps } from "@/services/native-memory.service";
import { readLastPush } from "@/services/push-state.service";
import type { InstructionFile } from "@/types/context.types";
import type { DoctorCheck, DoctorInput, InstructionConflict } from "@/types/doctor.types";

export const defaultDoctorInput = (): DoctorInput => ({
  nativeMemory: NATIVE_MEMORY_TARGETS,
  manualMemory: MANUAL_MEMORY_STEPS,
  manualInstructions: MANUAL_INSTRUCTION_STEPS,
  clientConfigs: Object.fromEntries(CONNECTED_CLIENTS.map((client) => [client, CLIENT_CONFIG_FILES[client]])),
  mcpTargets: MCP_TARGETS,
  instructionFiles: INSTRUCTION_SOURCES,
  projectsDir: CLAUDE_PROJECTS_DIR,
  extraMemoryDirs: EXTRA_MEMORY_SOURCES.map((source) => source.path),
  skillDirs: SKILL_SOURCES.map((source) => source.path),
  lastPushAt: readLastPush(),
});

const warn = (label: string, details: string[], fix: string): DoctorCheck => ({ status: "warn", label, details, fix });

const okCheck = (label: string): DoctorCheck => ({ status: "ok", label, details: [] });

const checkNativeMemory = (input: DoctorInput): DoctorCheck[] => [
  ...inspectNativeMemory(input.nativeMemory).map(({ target, result }) => {
    const { agent } = target;
    if (result.error) return warn(`${agent}: couldn't read ${target.file}`, [result.error.message], "runelay connect");
    return result.data.length
      ? warn(`${agent}: native memory is on`, [`${result.data.join(", ")} in ${target.file}`], "runelay connect")
      : okCheck(`${agent}: native memory is off`);
  }),
  ...installedManualSteps(input.manualMemory).map(
    ({ agent, step }): DoctorCheck => ({
      status: "info",
      label: `${agent}: native memory can only be turned off by hand`,
      details: [step],
    }),
  ),
];

const hasRunelayServer = (client: ClientId, content: string) => {
  if (client in TOML_HEADER_KEYS) return content.split("\n").some((line) => line.trim() === TOML_RUNELAY_HEADER);
  const config = JSON.parse(content) as { mcpServers?: Record<string, unknown> };
  return Boolean(config.mcpServers?.runelay);
};

const checkMcpTargets = (input: DoctorInput) =>
  input.mcpTargets
    .filter(({ detect }) => detect.some((path) => existsSync(path)))
    .map((target) => {
      const { registered, message } = readMcpRegistration(target);
      if (registered) return okCheck(`${target.name}: runelay MCP registered`);
      if (message) return warn(`${target.name}: couldn't read the config`, [message], "runelay connect");
      return warn(`${target.name}: runelay MCP missing from ${target.files[0]}`, [], "runelay connect");
    });

const checkMcpRegistration = (input: DoctorInput) => [
  ...(Object.entries(input.clientConfigs) as [ClientId, string][])
    .filter(([, file]) => existsSync(file))
    .map(([client, file]) => {
      const agent = CLIENT_AGENT_LABELS[client];
      let registered = false;
      try {
        registered = hasRunelayServer(client, readFileSync(file, "utf8"));
      } catch (error) {
        return warn(`${agent}: couldn't read ${file}`, [(error as Error).message], "runelay connect");
      }
      return registered
        ? okCheck(`${agent}: runelay MCP registered`)
        : warn(`${agent}: runelay MCP missing from ${file}`, [], "runelay connect");
    }),
  ...checkMcpTargets(input),
];

const forbidsLocalMemory = (context: string) => NEGATION_PATTERN.test(context);

export const findInstructionConflicts = (files: InstructionFile[]): InstructionConflict[] =>
  files
    .filter((file) => existsSync(file.path))
    .flatMap(({ path }) => {
      const conflicts: InstructionConflict[] = [];
      let managed = false;
      let block = "";
      readFileSync(path, "utf8")
        .split("\n")
        .forEach((line, index) => {
          if (line.includes(CONTEXT_START_MARKER)) managed = true;
          if (managed) {
            if (line.includes(CONTEXT_END_MARKER)) managed = false;
            block = "";
            return;
          }
          if (!line.trim() || BLOCK_START_PATTERN.test(line)) block = "";
          const match = LOCAL_MEMORY_PATTERNS.map((pattern) => line.match(pattern)).find(Boolean);
          if (match && !forbidsLocalMemory(`${block} ${line.slice(0, match.index)}`))
            conflicts.push({ path, line: index + 1, text: line.trim() });
          block = line.trim() ? `${block} ${line}` : "";
        });
      return conflicts;
    });

const checkInstructions = (input: DoctorInput) => {
  const conflicts = findInstructionConflicts(input.instructionFiles);
  if (!conflicts.length) return [okCheck("No local-memory rules in your instructions")];
  return [
    {
      ...warn(
        "Instructions tell agents to save memory outside runelay",
        conflicts.map(({ path, line, text }) => `${path}:${line}  ${text}`),
        "edit these lines so memory is saved only through runelay (write_memory)",
      ),
      paths: [...new Set(conflicts.map(({ path }) => path))],
    },
  ];
};

const checkManualInstructions = (input: DoctorInput): DoctorCheck[] =>
  (input.manualInstructions ?? [])
    .filter(({ detect }) => existsSync(detect))
    .map(({ agent, step }) => ({ status: "info", label: `${agent}: no global rules file`, details: [step] }));

const hasMemoryFiles = (directory: string) => readdirSync(directory).some((file) => file.endsWith(".md"));

const checkLeftoverMemories = (input: DoctorInput) => {
  const leftovers = [
    ...listMemoryDirectories(input.projectsDir, ""),
    ...input.extraMemoryDirs.filter((directory) => existsSync(directory) && statSync(directory).isDirectory()),
  ].filter(hasMemoryFiles);
  return leftovers.length
    ? [warn(`${leftovers.length} local agent memory folders left`, leftovers, "runelay migrate")]
    : [okCheck("No local memory left")];
};

const latestChange = (path: string): number => {
  const stats = statSync(path, { throwIfNoEntry: false });
  if (!stats) return 0;
  if (!stats.isDirectory()) return stats.mtimeMs;
  return readdirSync(path)
    .filter((name) => !SKIPPED_DIRECTORIES.has(name) && !name.startsWith("."))
    .reduce((latest, name) => Math.max(latest, latestChange(join(path, name))), stats.mtimeMs);
};

const localSkillRoots = (directories: string[]) =>
  directories.flatMap((directory) =>
    existsSync(directory)
      ? readdirSync(directory)
          .map((name) => join(directory, name))
          .filter(
            (root) =>
              !basename(root).startsWith(".") &&
              existsSync(join(root, SKILL_ENTRY_FILE)) &&
              !existsSync(join(root, SKILL_MARKER_FILE)),
          )
      : [],
  );

const checkSkillsPushed = (input: DoctorInput) => {
  const roots = localSkillRoots(input.skillDirs);
  if (!roots.length) return [okCheck("No local skills to push")];
  if (input.lastPushAt === null) return [warn(`${roots.length} local skills, never pushed`, [], "runelay push")];
  const lastPushAt = input.lastPushAt;
  const changed = roots.filter((root) => latestChange(root) > lastPushAt);
  return changed.length
    ? [warn(`${changed.length} skills changed since the last push`, changed, "runelay push")]
    : [okCheck("Local skills are pushed")];
};

const tagged = (kind: string, checks: DoctorCheck[]) => checks.map((check) => ({ ...check, kind }));

export const runDoctor = (input = defaultDoctorInput()): DoctorCheck[] => [
  ...tagged("native_memory", checkNativeMemory(input)),
  ...tagged("mcp", checkMcpRegistration(input)),
  ...tagged("instructions", checkInstructions(input)),
  ...tagged("manual_instructions", checkManualInstructions(input)),
  ...tagged("leftover_memories", checkLeftoverMemories(input)),
  ...tagged("skills", checkSkillsPushed(input)),
];
