import { join } from "node:path";
import { cliEnv } from "@/config/env";

export const CONFIG_DIR = join(cliEnv.XDG_CONFIG_HOME || join(cliEnv.RUNELEY_HOME, ".config"), "runeley");

export const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export const SERVER_ENV_FILE = join(cliEnv.RUNELEY_HOME, "runeley", ".env");

export const LOCAL_SERVER_URL = "http://localhost:4312";

export const HEALTH_TIMEOUT_MS = 2500;

export const SKILL_MARKER_FILE = ".runeley";

export const SKILLS_TARGET_DIR = join(cliEnv.RUNELEY_HOME, ".claude", "skills");

export const SKILL_PAGE_SIZE = 100;

export const SKILL_FETCH_CONCURRENCY = 4;

export const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export const HELP_TEXT = `runeley: suas memórias, habilidades e conexões iguais em todos os agentes.

Uso: runeley <comando>

  login [url]   entra no servidor pelo navegador e guarda a chave deste computador
  status        mostra o servidor, a organização e o que está guardado nela
  push          envia memórias, habilidades e instruções dos agentes locais
  pull          traz o resumo para CLAUDE.md e AGENTS.md e as habilidades novas
  sync          push e depois pull
  connect       registra o MCP do runeley no Claude Code, Codex, Cursor e Grok
  import        transforma os MCPs configurados nos agentes em conexões
  logout        revoga a chave deste computador e apaga a configuração

  help          esta ajuda
  --version     versão do CLI

Para CI, RUNELEY_URL e RUNELEY_API_KEY substituem a configuração salva.`;
