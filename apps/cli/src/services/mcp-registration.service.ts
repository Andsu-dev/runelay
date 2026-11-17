import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { attemptSync, type Result } from "@runelay/shared";
import { MCP_TARGETS } from "@/constants/mcp-targets.constants";
import { getIn, isObject, parseJsonObject, setIn } from "@/lib/json";
import { readYamlBlock, setYamlBlock } from "@/lib/yaml";
import type { McpRegistration, McpTarget } from "@/types/mcp-target.types";

const SERVER_NAME = "runelay";

type Which = (command: string) => string | null;

const bunWhich: Which = (command) => Bun.which(command);

const readContent = (file: string) => (existsSync(file) ? readFileSync(file, "utf8") : "");

const parseJsonConfig = (content: string, file: string) => {
  try {
    return parseJsonObject(content, file);
  } catch (error) {
    if (error instanceof SyntaxError)
      throw new Error(`${file} isn't valid JSON (${error.message}); add runelay by hand`);
    throw error;
  }
};

const jsonWithServer = (content: string, file: string, serverPath: string, entry: Record<string, unknown>) => {
  const config = parseJsonConfig(content, file);
  const servers = getIn(config, serverPath);
  if (servers !== undefined && !isObject(servers)) throw new Error(`${serverPath} in ${file} is not an object`);
  const current = isObject(servers) ? servers[SERVER_NAME] : undefined;
  if (JSON.stringify(current) === JSON.stringify(entry)) return content;
  setIn(config, `${serverPath}.${SERVER_NAME}`, entry);
  return `${JSON.stringify(config, null, 2)}${!content || content.endsWith("\n") ? "\n" : ""}`;
};

const withServer = (target: McpTarget, file: string, content: string, entry: ReturnType<McpTarget["entry"]>) =>
  target.format === "yaml"
    ? setYamlBlock(content, target.serverPath, SERVER_NAME, entry)
    : jsonWithServer(content, file, target.serverPath, entry);

const hasServer = (target: McpTarget, file: string, content: string) => {
  if (target.format === "yaml") return readYamlBlock(content, target.serverPath, SERVER_NAME) !== undefined;
  const servers = getIn(parseJsonConfig(content, file), target.serverPath);
  return isObject(servers) && servers[SERVER_NAME] !== undefined;
};

const filesToWrite = ({ files, mirrors = [] }: McpTarget) => [
  files.find((file) => existsSync(file)) ?? files[0] ?? "",
  ...mirrors.filter((file) => existsSync(file)),
];

export const isMcpTargetInstalled = (target: McpTarget, which: Which = bunWhich) =>
  target.detect.some((path) => existsSync(path)) || Boolean(target.command && which(target.command));

export const installedMcpTargets = (targets = MCP_TARGETS, which: Which = bunWhich) =>
  targets.filter((target) => isMcpTargetInstalled(target, which));

export const registerMcpTarget = (target: McpTarget, url: string, authorization: string): Result<string[]> =>
  attemptSync(() => {
    const entry = target.entry(url, authorization);
    const planned = filesToWrite(target).map((file) => {
      const content = readContent(file);
      return { file, content, next: withServer(target, file, content, entry) };
    });
    const pending = planned.filter(({ file, content, next }) => content !== next || !existsSync(file));
    for (const { file, next } of pending) {
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, next);
    }
    return pending.map(({ file }) => file);
  }, "STORAGE_FAILED");

const fileRegistration = (target: McpTarget, file: string): McpRegistration => {
  try {
    return { registered: hasServer(target, file, readFileSync(file, "utf8")), message: null };
  } catch (error) {
    return { registered: false, message: (error as Error).message };
  }
};

export const readMcpRegistration = (target: McpTarget): McpRegistration => {
  const results = [...target.files, ...(target.mirrors ?? []), ...(target.lookups ?? [])]
    .filter((file) => existsSync(file))
    .map((file) => fileRegistration(target, file));
  if (results.some(({ registered }) => registered)) return { registered: true, message: null };
  return { registered: false, message: results.find(({ message }) => message)?.message ?? null };
};

const authorizationIn = (target: McpTarget, file: string, content: string) => {
  if (target.format === "yaml") {
    const block = readYamlBlock(content, target.serverPath, SERVER_NAME) ?? "";
    const value = block.match(/^\s*Authorization:\s*(.+)$/m)?.[1]?.trim();
    return value ? value.replace(/^["']|["']$/g, "") : null;
  }
  const servers = getIn(parseJsonConfig(content, file), target.serverPath);
  const entry = isObject(servers) ? servers[SERVER_NAME] : undefined;
  const headers = isObject(entry) ? entry.headers : undefined;
  return isObject(headers) && typeof headers.Authorization === "string" ? headers.Authorization : null;
};

export const readMcpAuthorization = (target: McpTarget): string | null => {
  const file = target.files.find((candidate) => existsSync(candidate));
  if (!file) return null;
  try {
    return authorizationIn(target, file, readFileSync(file, "utf8"));
  } catch {
    return null;
  }
};
