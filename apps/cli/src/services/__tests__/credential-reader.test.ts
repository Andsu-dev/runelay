import { expect, test } from "bun:test";
import type { ClientId } from "../../constants/clients.constants";
import {
  planKeychainReads,
  readKeychainCredentials,
  wantedKeychainSources,
} from "../credential-reader.service";
import type { ClientSource } from "../../types/client-config.types";
import type { LocalCredential } from "../../types/credential.types";

const remote = (client: ClientId, name: string, url: string): ClientSource => ({
  client,
  agent: client,
  source: { name, config: { kind: "mcp", url, headers: {} } },
  identity: url,
});

const sources = [
  remote("codex", "linear", "https://mcp.linear.app/mcp"),
  remote("codex", "notion", "https://mcp.notion.com/mcp"),
  remote("codex", "sentry", "https://mcp.sentry.dev/mcp"),
  remote("claude", "github", "https://api.githubcopilot.com/mcp"),
  {
    client: "codex",
    agent: "codex",
    source: { name: "local", config: { kind: "stdio", command: "npx", args: [], env: {} } },
    identity: "stdio:npx ",
  } as ClientSource,
];

const fileCredential: LocalCredential = {
  agent: "Grok",
  serverName: "sentry",
  url: "https://mcp.sentry.dev/mcp",
  clientId: "c",
  refreshToken: "r",
};

const accounts = ["linear|aaa", "notion|bbb", "sentry|ccc", "brotu|ddd", "Linear|eee"];

test("only servers in the config, not connected in runelay and without a file login reach the keychain", () => {
  const wanted = wantedKeychainSources(sources, new Set(["https://mcp.notion.com/mcp"]), [fileCredential]);
  expect(wanted.map(({ source }) => source.name)).toEqual(["linear", "github"]);
  const listed: string[] = [];
  const plan = planKeychainReads(wanted, (service) => {
    listed.push(service);
    return accounts;
  });
  expect(plan).toEqual({ codexAccounts: ["linear|aaa", "Linear|eee"], claude: true, prompts: 3 });
  expect(listed).toEqual(["Codex MCP Credentials"]);
});

test("nothing to read means no keychain listing and zero prompts", () => {
  const connected = new Set(sources.map(({ identity }) => identity));
  const plan = planKeychainReads(wantedKeychainSources(sources, connected, []), () => {
    throw new Error("must not list");
  });
  expect(plan).toEqual({ codexAccounts: [], claude: false, prompts: 0 });
  expect(readKeychainCredentials(plan, () => {
    throw new Error("must not read");
  })).toEqual([]);
});

test("each planned item is read exactly once", () => {
  const reads: string[] = [];
  const entry = {
    server_name: "linear",
    url: "https://mcp.linear.app/mcp",
    client_id: "codex-client",
    token_response: { access_token: "a", refresh_token: "r" },
  };
  const credentials = readKeychainCredentials({ codexAccounts: ["linear|aaa"], claude: true, prompts: 2 }, (service, account) => {
    reads.push(`${service}:${account ?? ""}`);
    return service === "Codex MCP Credentials" ? JSON.stringify(entry) : null;
  });
  expect(reads).toEqual(["Codex MCP Credentials:linear|aaa", "Claude Code-credentials:"]);
  expect(credentials.map(({ serverName }) => serverName)).toEqual(["linear"]);
});
