import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Result } from "@runeley/shared";

export const toToolResponse = (result: Result<unknown>): CallToolResult => {
  const payload = result.error ? { error: result.error } : result.data;
  return {
    content: [{ type: "text", text: typeof payload === "string" ? payload : JSON.stringify(payload, null, 2) }],
    ...(result.error ? { isError: true } : {}),
  };
};
