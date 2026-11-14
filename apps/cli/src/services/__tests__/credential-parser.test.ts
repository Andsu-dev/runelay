import { expect, test } from "bun:test";
import {
  parseClaudeCredentials,
  parseCodexCredentials,
  parseGrokCredentials,
  toEpochMs,
} from "../credential-parser.service";

const NOW = Date.parse("2026-11-14T12:00:00Z");

test("grok: splits name and url from the key and derives expiry from received time", () => {
  const raw = JSON.stringify({
    "linear:https://mcp.linear.app/mcp": {
      client_id: "grok-client",
      token_response: { access_token: "a1", token_type: "Bearer", expires_in: 3600, refresh_token: "r1" },
      granted_scopes: ["read", "write"],
      token_received_at: NOW / 1000,
      issuer: "https://linear.app",
    },
    "broken:https://x.example.com": { token_response: {} },
    "no-url": { client_id: "c", token_response: { access_token: "a" } },
  });
  const [credential, ...rest] = parseGrokCredentials(raw, NOW);
  expect(rest).toHaveLength(0);
  expect(credential).toMatchObject({
    agent: "Grok",
    serverName: "linear",
    url: "https://mcp.linear.app/mcp",
    clientId: "grok-client",
    accessToken: "a1",
    refreshToken: "r1",
    expiresAt: NOW + 3_600_000,
    scope: "read write",
    tokenType: "Bearer",
  });
});

test("codex: reads a single keychain value and a map from the file fallback", () => {
  const entry = {
    server_name: "visorfinance",
    url: "https://mcp.visor.example/mcp",
    client_id: "codex-client",
    token_response: { access_token: "a2", token_type: "bearer", expires_in: 100, refresh_token: "r2", scope: "s" },
    expires_at: NOW + 60_000,
  };
  expect(parseCodexCredentials(JSON.stringify(entry), NOW)[0]).toMatchObject({
    agent: "Codex",
    serverName: "visorfinance",
    refreshToken: "r2",
    expiresAt: NOW + 60_000,
  });
  expect(parseCodexCredentials(JSON.stringify({ "visorfinance|abc": entry }), NOW)).toHaveLength(1);
  expect(parseCodexCredentials("not json", NOW)).toHaveLength(0);
});

test("claude: keeps only mcpOAuth entries with a refresh token or a live access token", () => {
  const raw = JSON.stringify({
    claudeAiOauth: { accessToken: "never-sent", refreshToken: "never-sent" },
    mcpOAuth: {
      "github|1": {
        serverName: "github",
        serverUrl: "https://api.githubcopilot.com/mcp/",
        clientId: "c1",
        accessToken: "a3",
        refreshToken: "r3",
        expiresAt: NOW - 1000,
      },
      "notion|2": {
        serverName: "notion",
        serverUrl: "https://mcp.notion.com/mcp",
        clientId: "c2",
        accessToken: "a4",
        expiresAt: NOW + 1000,
      },
      "stale|3": {
        serverName: "stale",
        serverUrl: "https://stale.example/mcp",
        clientId: "c3",
        accessToken: "a5",
        expiresAt: NOW - 1,
      },
      "empty|4": { serverName: "empty", serverUrl: "https://empty.example/mcp", clientId: "c4" },
    },
  });
  const credentials = parseClaudeCredentials(raw, NOW);
  expect(credentials.map((credential) => credential.serverName)).toEqual(["github", "notion"]);
  expect(JSON.stringify(credentials)).not.toContain("never-sent");
});

test("epoch values in seconds, milliseconds and ISO all become milliseconds", () => {
  expect(toEpochMs(NOW / 1000)).toBe(NOW);
  expect(toEpochMs(NOW)).toBe(NOW);
  expect(toEpochMs(String(NOW / 1000))).toBe(NOW);
  expect(toEpochMs("2026-11-14T12:00:00Z")).toBe(NOW);
  expect(toEpochMs("nope")).toBeUndefined();
});
