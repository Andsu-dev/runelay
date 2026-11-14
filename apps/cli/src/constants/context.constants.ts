import { cliEnv } from "@/config/env";
import type { AgentDirectory, InstructionFile } from "@/types/context.types";

const HOME = cliEnv.RUNELEY_HOME;

export const CLAUDE_PROJECTS_DIR = `${HOME}/.claude/projects`;

export const CURRENT_PROJECT_MEMORY_DIR = `${CLAUDE_PROJECTS_DIR}/${process.cwd().replaceAll("/", "-")}/memory`;

export const SKILL_SOURCES: AgentDirectory[] = cliEnv.RUNELEY_SKILLS_DIR
  ? [{ agent: "Personalizado", path: cliEnv.RUNELEY_SKILLS_DIR }]
  : [
      { agent: "Claude Code", path: `${HOME}/.claude/skills` },
      { agent: "Agentes (universal)", path: `${HOME}/.agents/skills` },
      { agent: "Codex", path: `${HOME}/.codex/skills` },
      { agent: "Cursor", path: `${HOME}/.cursor/skills` },
      { agent: "Cursor", path: `${HOME}/.cursor/skills-cursor` },
      { agent: "Grok", path: `${HOME}/.grok/skills` },
      { agent: "Gemini", path: `${HOME}/.gemini/skills` },
      { agent: "OpenCode", path: `${HOME}/.config/opencode/skills` },
    ];

export const EXTRA_MEMORY_SOURCES: AgentDirectory[] = [{ agent: "Codex", path: `${HOME}/.codex/memories` }];

export const INSTRUCTION_SOURCES: InstructionFile[] = [
  { agent: "Claude Code", path: `${HOME}/.claude/CLAUDE.md`, slug: "instrucoes-globais-claude-code" },
  { agent: "Codex", path: `${HOME}/.codex/AGENTS.md`, slug: "instrucoes-globais-codex" },
  { agent: "Grok", path: `${HOME}/.grok/AGENTS.md`, slug: "instrucoes-globais-grok" },
  { agent: "Gemini", path: `${HOME}/.gemini/GEMINI.md`, slug: "instrucoes-globais-gemini" },
  { agent: "OpenCode", path: `${HOME}/.config/opencode/AGENTS.md`, slug: "instrucoes-globais-opencode" },
];

export const MEMORY_INDEX_FILE = "MEMORY.md";

export const PINNED_SECTION = "## Regras de ouro";

export const SKILL_ENTRY_FILE = "SKILL.md";

export const SKILL_FILE_MAX_BYTES = 200 * 1024;

export const SKILL_FILES_MAX = 200;

export const SKIPPED_DIRECTORIES = new Set(["node_modules", ".git", ".venv", "__pycache__", "dist", "build"]);

export const BINARY_EXTENSIONS =
  /\.(png|jpe?g|gif|webp|ico|icns|pdf|zip|gz|tgz|tar|woff2?|ttf|otf|mp3|mp4|mov|wav|webm|sqlite|db|wasm|so|dylib|exe|bin|psd|fig|sketch|heic|pyc|class|jar|DS_Store)$/i;

export const MEMORY_BATCH_SIZE = 200;

export const SKILL_BATCH_SIZE = 20;

export const LIMITS = {
  memoryName: 200,
  memoryDescription: 400,
  memoryBody: 100_000,
  skillName: 200,
  skillDescription: 2000,
  skillBody: 200_000,
  filePath: 300,
};

export const CONTEXT_START_MARKER = "<!-- runeley:start -->";

export const CONTEXT_END_MARKER = "<!-- runeley:end -->";

export const CONTEXT_TARGETS = {
  claude: `${cliEnv.RUNELEY_HOME}/.claude/CLAUDE.md`,
  codex: `${cliEnv.RUNELEY_HOME}/.codex/AGENTS.md`,
  grok: `${cliEnv.RUNELEY_HOME}/.grok/AGENTS.md`,
} as const;
