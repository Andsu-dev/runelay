import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { attemptSync, type Result } from "@runelay/shared";
import { RUNELAY_TOOLS } from "@/constants/context.constants";
import { isObject, parseJsonObject } from "@/lib/json";

export const CODEX_APPROVAL_MODE = "approve";

export const codexToolApprovals = (tools: readonly string[] = RUNELAY_TOOLS) =>
  tools.map((tool) => `[mcp_servers.runelay.tools.${tool}]\napproval_mode = "${CODEX_APPROVAL_MODE}"\n`).join("\n");

export const cursorToolPermissions = (tools: readonly string[] = RUNELAY_TOOLS) =>
  tools.map((tool) => `Mcp(runelay:${tool})`);

export const claudeToolPermissions = (tools: readonly string[] = RUNELAY_TOOLS) =>
  tools.map((tool) => `mcp__runelay__${tool}`);

const withAllowed = (content: string, file: string, entries: string[]) => {
  const config = parseJsonObject(content, file);
  const permissions = config.permissions ?? {};
  if (!isObject(permissions)) throw new Error(`permissions in ${file} is not an object`);
  const allow = permissions.allow ?? [];
  if (!Array.isArray(allow)) throw new Error(`permissions.allow in ${file} is not a list`);
  const missing = entries.filter((entry) => !allow.includes(entry));
  if (!missing.length) return content;
  config.permissions = { ...permissions, allow: [...allow, ...missing] };
  return `${JSON.stringify(config, null, 2)}\n`;
};

export const withCursorPermissions = (content: string, file: string, tools: readonly string[] = RUNELAY_TOOLS) =>
  withAllowed(content, file, cursorToolPermissions(tools));

export const withClaudePermissions = (content: string, file: string, tools: readonly string[] = RUNELAY_TOOLS) =>
  withAllowed(content, file, claudeToolPermissions(tools));

const allowTools = (file: string, merge: (content: string, file: string) => string): Result<boolean> =>
  attemptSync(() => {
    const current = existsSync(file) ? readFileSync(file, "utf8") : "";
    const next = merge(current, file);
    if (next === current) return false;
    writeFileSync(file, next);
    return true;
  }, "STORAGE_FAILED");

export const allowCursorTools = (file: string) => allowTools(file, withCursorPermissions);

export const allowClaudeTools = (file: string) => allowTools(file, withClaudePermissions);
