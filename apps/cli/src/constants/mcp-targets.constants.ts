import { join } from "node:path";
import { cliEnv } from "@/config/env";
import type { McpTarget, McpTargetDirs } from "@/types/mcp-target.types";

const bearer = (authorization: string) => ({ Authorization: authorization });

export const mcpTargetsFor = (home: string, dirs: McpTargetDirs = {}): McpTarget[] => {
  const opencode = join(dirs.configHome ?? join(home, ".config"), "opencode");
  const kimi = dirs.kimiHome ?? join(home, ".kimi-code");
  return [
    {
      id: "cursor",
      name: "Cursor",
      detect: [join(home, ".cursor")],
      format: "json",
      serverPath: "mcpServers",
      files: [join(home, ".cursor", "mcp.json")],
      entry: (url, authorization) => ({ url, headers: bearer(authorization) }),
    },
    {
      id: "gemini",
      name: "Gemini",
      detect: [join(home, ".gemini", "settings.json")],
      command: "gemini",
      format: "json",
      serverPath: "mcpServers",
      files: [join(home, ".gemini", "settings.json")],
      entry: (url, authorization) => ({ url, type: "http", headers: bearer(authorization) }),
    },
    {
      id: "antigravity",
      name: "Antigravity",
      detect: [join(home, ".gemini", "antigravity"), join(home, ".gemini", "config")],
      format: "json",
      serverPath: "mcpServers",
      files: [join(home, ".gemini", "config", "mcp_config.json")],
      mirrors: [join(home, ".gemini", "antigravity", "mcp_config.json")],
      entry: (url, authorization) => ({ serverUrl: url, headers: bearer(authorization) }),
    },
    {
      id: "opencode",
      name: "OpenCode",
      detect: [opencode],
      format: "json",
      serverPath: "mcp",
      files: [join(opencode, "opencode.json"), join(opencode, "opencode.jsonc")],
      lookups: [join(opencode, "config.json")],
      entry: (url, authorization) => ({
        type: "remote",
        url,
        enabled: true,
        oauth: false,
        headers: bearer(authorization),
      }),
    },
    {
      id: "kimi",
      name: "Kimi Code",
      detect: [kimi],
      command: "kimi",
      format: "json",
      serverPath: "mcpServers",
      files: [join(kimi, "mcp.json")],
      entry: (url, authorization) => ({ transport: "http", url, headers: bearer(authorization) }),
    },
    {
      id: "hermes",
      name: "Hermes Agent",
      detect: [join(home, ".hermes")],
      format: "yaml",
      serverPath: "mcp_servers",
      files: [join(home, ".hermes", "config.yaml")],
      entry: (url, authorization) => ({ url, headers: bearer(authorization) }),
    },
    {
      id: "openclaw",
      name: "OpenClaw",
      detect: [join(home, ".openclaw")],
      format: "json",
      serverPath: "mcp.servers",
      files: [join(home, ".openclaw", "openclaw.json")],
      entry: (url, authorization) => ({ url, transport: "streamable-http", headers: bearer(authorization) }),
    },
    {
      id: "mausbot",
      name: "MausBot",
      detect: [join(home, ".openmausbot")],
      format: "json",
      serverPath: "mcpServers",
      files: [join(home, ".openmausbot", "config.json")],
      entry: (url, authorization) => ({ type: "http", url, headers: bearer(authorization) }),
    },
  ];
};

export const MCP_TARGETS = mcpTargetsFor(cliEnv.RUNELAY_HOME, {
  configHome: cliEnv.XDG_CONFIG_HOME,
  kimiHome: cliEnv.KIMI_CODE_HOME,
});
