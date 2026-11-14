import { runInNewContext } from "node:vm";
import { attempt, type Result } from "@runeley/shared";
import { listLiveTools } from "@/modules/connectors/services/connection.service";
import { EXECUTE_SYNC_TIMEOUT_MS, EXECUTE_TIMEOUT_MS } from "@/modules/gateway/constants/gateway.constants";
import { callTrackedTool } from "@/modules/gateway/services/tool-call.service";
import type { ExecuteOutput, GatewayCaller, ToolNamespace } from "@/modules/gateway/types/gateway.types";

export const runCode = async (caller: GatewayCaller, code: string): Promise<Result<ExecuteOutput>> => {
  const tools = await listLiveTools(caller.organizationId);
  if (tools.error) return tools;

  const namespace: ToolNamespace = {};
  for (const tool of tools.data) {
    namespace[tool.source] = {
      ...namespace[tool.source],
      [tool.name]: (args = {}) => callTrackedTool(caller, tool, args),
    };
  }

  const logs: string[] = [];
  const log = (...parts: unknown[]) =>
    logs.push(parts.map((part) => (typeof part === "string" ? part : JSON.stringify(part))).join(" "));
  const context = { tools: namespace, console: { log, error: log }, fetch, URL, URLSearchParams, setTimeout };

  return attempt(async () => {
    const running = runInNewContext(`(async () => {\n${code}\n})()`, context, { timeout: EXECUTE_SYNC_TIMEOUT_MS });
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`execute passou de ${EXECUTE_TIMEOUT_MS / 1000}s`)), EXECUTE_TIMEOUT_MS),
    );
    return { result: await Promise.race([running, timeout]), logs };
  }, "EXECUTE_FAILED");
};
