import type { Result } from "@runelay/shared";
import { recordToolCall } from "@/modules/activity/repositories/activity.repository";
import type { Tool, ToolArgs } from "@/modules/connectors/types/connector.types";
import type { GatewayCaller } from "@/modules/gateway/types/gateway.types";

export const callTrackedTool = async (caller: GatewayCaller, tool: Tool, args: ToolArgs): Promise<Result<unknown>> => {
  const startedAt = performance.now();
  const result = await tool.call(args);
  recordToolCall({
    organizationId: caller.organizationId,
    apiKeyId: caller.apiKeyId,
    source: tool.source,
    tool: tool.name,
    ok: !result.error,
    durationMs: performance.now() - startedAt,
  });
  return result;
};
