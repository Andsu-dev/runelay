import { EXECUTE_SYNC_TIMEOUT_MS, EXECUTE_TIMEOUT_MS } from "@/modules/gateway/constants/gateway.constants";
import type { SandboxLimits } from "@/modules/gateway/types/sandbox.types";

export const EXECUTE_LIMITS: SandboxLimits = {
  memoryBytes: 32 * 1024 * 1024,
  maxStackBytes: 512 * 1024,
  maxLogChars: 1_000_000,
  cpuMs: EXECUTE_SYNC_TIMEOUT_MS,
  wallMs: EXECUTE_TIMEOUT_MS,
};

export const SANDBOX_FILENAME = "execute.js";

export const SANDBOX_PRELUDE = `(call, log, manifestText) => {
  const format = (parts) => parts.map((part) => (typeof part === "string" ? part : JSON.stringify(part))).join(" ");
  globalThis.console = Object.freeze({ log: (...parts) => log(format(parts)), error: (...parts) => log(format(parts)) });
  const manifest = JSON.parse(manifestText);
  const tools = {};
  for (const source of Object.keys(manifest)) {
    const namespace = {};
    for (const name of manifest[source]) {
      namespace[name] = async (args) => JSON.parse(await call(source, name, String(JSON.stringify(args === undefined ? {} : args))));
    }
    tools[source] = Object.freeze(namespace);
  }
  globalThis.tools = Object.freeze(tools);
}`;

export const SANDBOX_RUNNER = `(run, done, failed) => {
  const describe = (error) => {
    try {
      return error instanceof Error ? error.name + ": " + error.message : String(error);
    } catch {
      return "Error";
    }
  };
  (async () => run())().then(
    (value) => {
      try {
        done(value === undefined ? undefined : JSON.stringify(value));
      } catch (error) {
        failed(describe(error));
      }
    },
    (error) => failed(describe(error)),
  );
}`;

export const SANDBOX_MESSAGES = {
  cpu: (limits: SandboxLimits) => `o código passou de ${limits.cpuMs / 1000}s de processamento`,
  wall: (limits: SandboxLimits) => `execute passou de ${limits.wallMs / 1000}s`,
  memory: (limits: SandboxLimits) => `o código passou do limite de ${limits.memoryBytes / 1024 / 1024} MB de memória`,
  stalled: "o código ficou esperando uma promise que nunca resolve",
  invalidArgs: "os argumentos da tool precisam ser um objeto JSON",
  invalidToolResult: "a resposta da tool não é JSON",
  invalidResult: "o valor retornado não é JSON",
  missingTool: (source: string, name: string) => `a tool ${source}.${name} não existe`,
};
