import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { ImportView, OAuthStartView, SourcesSummaryView, SourceView } from "@runelay/shared";
import { findSource } from "@/modules/sources/repositories/source.repository";
import { body, call, createApiKey, signUp, type TestAccount } from "../../../../../test/helpers";
import {
  closedUrl,
  FAKE_ACCESS_TOKEN,
  type FakeMcpServer,
  INLINE_SPEC,
  startFakeMcp,
  withEnv,
} from "../../../../../test/sources-helpers";

let account: TestAccount;
let apiKey: string;
let open: FakeMcpServer;
let locked: FakeMcpServer;
const restores: (() => void)[] = [];

beforeAll(async () => {
  restores.push(withEnv("RUNELAY_ALLOW_PRIVATE_URLS", true));
  account = await signUp("Sources Owner");
  apiKey = (await createApiKey(account, "sources")).key;
  open = startFakeMcp();
  locked = startFakeMcp({ requireToken: true });
});

afterAll(() => {
  for (const restore of restores.reverse()) restore();
  open.stop();
  locked.stop();
});

const create = (name: string, config: Record<string, unknown>, auth: { cookie?: string; bearer?: string } = {}) =>
  call("/v1/sources", { method: "POST", json: { name, config }, ...(auth.bearer ? auth : { cookie: account.cookie }) });

describe("create and read", () => {
  test("creates an mcp source that connects and lists its tools", async () => {
    const response = await create("open_mcp", { kind: "mcp", url: open.mcpUrl, headers: { "x-token": "secret" } });
    expect(response.status).toBe(201);
    const { data } = await body<SourceView>(response);
    expect(data.status).toBe("ok");
    expect(data.toolCount).toBe(1);
    expect(data.enabled).toBe(true);
    expect(data.config).toMatchObject({ headers: { "x-token": "secret" } });
  });

  test("marks a protected mcp source as needing auth", async () => {
    const response = await create("locked_mcp", { kind: "mcp", url: locked.mcpUrl });
    const { data } = await body<SourceView>(response);
    expect(data.status).toBe("needs_auth");
  });

  test("marks an unreachable source as error", async () => {
    const response = await create("down_mcp", { kind: "mcp", url: closedUrl() });
    const { data } = await body<SourceView>(response);
    expect(data.status).toBe("error");
    expect(data.error).toBeTruthy();
  });

  test("creates an openapi source from an inline spec", async () => {
    const response = await create("inline_api", {
      kind: "openapi",
      spec: INLINE_SPEC,
      headers: { authorization: "k" },
      query: { token: "q" },
    });
    const { data } = await body<SourceView>(response);
    expect(data.status).toBe("ok");
    expect(data.toolCount).toBe(1);
  });

  test("session sees the raw config and api keys see it redacted", async () => {
    const asSession = await body<SourceView[]>(await call("/v1/sources", { cookie: account.cookie }));
    const sessionInline = asSession.data.find((view) => view.name === "inline_api");
    expect(sessionInline?.config).toMatchObject({ headers: { authorization: "k" }, query: { token: "q" } });
    const asKey = await body<SourceView[]>(await call("/v1/sources", { bearer: apiKey }));
    const keyInline = asKey.data.find((view) => view.name === "inline_api");
    expect(keyInline?.config).toMatchObject({ headers: { authorization: "••••••" }, query: { token: "••••••" } });
    const keyMcp = asKey.data.find((view) => view.name === "open_mcp");
    expect(keyMcp?.config).toMatchObject({ headers: { "x-token": "••••••" } });
  });

  test("filters the list by status", async () => {
    const { data } = await body<SourceView[]>(await call("/v1/sources?status=needs_auth", { cookie: account.cookie }));
    expect(data.map((view) => view.name)).toEqual(["locked_mcp"]);
  });

  test("reads one source raw for sessions and redacted for api keys", async () => {
    const raw = await body<SourceView>(await call("/v1/sources/open_mcp", { cookie: account.cookie }));
    expect(raw.data.config).toMatchObject({ headers: { "x-token": "secret" } });
    const redacted = await body<SourceView>(await call("/v1/sources/open_mcp", { bearer: apiKey }));
    expect(redacted.data.config).toMatchObject({ headers: { "x-token": "••••••" } });
  });

  test("returns SOURCE_NOT_FOUND for unknown names", async () => {
    const asSession = await call("/v1/sources/missing", { cookie: account.cookie });
    expect(asSession.status).toBe(404);
    expect((await body(asSession)).error?.code).toBe("SOURCE_NOT_FOUND");
    const asKey = await call("/v1/sources/missing", { bearer: apiKey });
    expect((await body(asKey)).error?.code).toBe("SOURCE_NOT_FOUND");
  });

  test("summarizes enabled tools and sources needing attention", async () => {
    const { data } = await body<SourcesSummaryView>(await call("/v1/sources/summary", { cookie: account.cookie }));
    expect(data).toEqual({ total: 4, tools: 2, attention: 2 });
  });

  test("summary of an empty organization is zero", async () => {
    const other = await signUp("Empty");
    const { data } = await body<SourcesSummaryView>(await call("/v1/sources/summary", { cookie: other.cookie }));
    expect(data).toEqual({ total: 0, tools: 0, attention: 0 });
  });
});

describe("policy", () => {
  test("refuses stdio sources while the flag is off", async () => {
    const response = await create("cmd", { kind: "stdio", command: "echo" });
    expect(response.status).toBe(403);
  });

  test("refuses stdio sources from api keys even with the flag on", async () => {
    const restore = withEnv("RUNELAY_ENABLE_STDIO", true);
    try {
      const response = await create("cmd", { kind: "stdio", command: "echo" }, { bearer: apiKey });
      expect(response.status).toBe(403);
      expect((await body(response)).error?.message).toContain("owner ou admin");
    } finally {
      restore();
    }
  });

  test("lets the owner create a stdio source and redacts its env for api keys", async () => {
    const restore = withEnv("RUNELAY_ENABLE_STDIO", true);
    try {
      const response = await create("cmd_local", {
        kind: "stdio",
        command: "runelay-command-that-does-not-exist",
        env: { SECRET: "value" },
      });
      expect(response.status).toBe(201);
      const { data } = await body<SourceView>(response);
      expect(data.status).toBe("error");
      const redacted = await body<SourceView>(await call("/v1/sources/cmd_local", { bearer: apiKey }));
      expect(redacted.data.config).toMatchObject({ env: { SECRET: "••••••" } });
    } finally {
      restore();
    }
  });

  test("refuses private urls when they are not allowed", async () => {
    const restore = withEnv("RUNELAY_ALLOW_PRIVATE_URLS", false);
    try {
      const response = await create("private", { kind: "mcp", url: "http://127.0.0.1:9/mcp" });
      expect(response.status).toBe(403);
      expect((await body(response)).error?.message).toContain("rede interna");
    } finally {
      restore();
    }
  });
});

describe("update, test and remove", () => {
  test("disables and re-enables a source", async () => {
    const disabled = await call("/v1/sources/open_mcp", {
      method: "PATCH",
      cookie: account.cookie,
      json: { enabled: false },
    });
    expect((await body<SourceView>(disabled)).data.enabled).toBe(false);
    const enabled = await call("/v1/sources/open_mcp", {
      method: "PATCH",
      cookie: account.cookie,
      json: { enabled: true },
    });
    const { data } = await body<SourceView>(enabled);
    expect(data.enabled).toBe(true);
    expect(data.status).toBe("ok");
  });

  test("replaces the config of a source", async () => {
    const response = await call("/v1/sources/down_mcp", {
      method: "PATCH",
      cookie: account.cookie,
      json: { config: { kind: "mcp", url: open.mcpUrl } },
    });
    expect((await body<SourceView>(response)).data.status).toBe("ok");
  });

  test("rejects a config update that breaks the policy", async () => {
    const response = await call("/v1/sources/down_mcp", {
      method: "PATCH",
      cookie: account.cookie,
      json: { config: { kind: "mcp", url: "ftp://example.com/mcp" } },
    });
    expect(response.status).toBe(400);
  });

  test("updating an unknown source fails", async () => {
    const response = await call("/v1/sources/missing", {
      method: "PATCH",
      cookie: account.cookie,
      json: { enabled: true },
    });
    expect(response.status).toBe(404);
  });

  test("tests a source connection on demand", async () => {
    const response = await call("/v1/sources/inline_api/test", { method: "POST", cookie: account.cookie });
    expect((await body<SourceView>(response)).data.status).toBe("ok");
  });

  test("removes a source and then reports it missing", async () => {
    const removed = await call("/v1/sources/down_mcp", { method: "DELETE", cookie: account.cookie });
    expect(removed.status).toBe(200);
    const again = await call("/v1/sources/down_mcp", { method: "DELETE", cookie: account.cookie });
    expect(again.status).toBe(404);
  });
});

describe("import", () => {
  test("imports sources with oauth tokens and skips the ones the policy refuses", async () => {
    const response = await call("/v1/sources/import", {
      method: "POST",
      cookie: account.cookie,
      json: {
        sources: [
          {
            name: "imported_locked",
            config: { kind: "mcp", url: locked.mcpUrl },
            oauth: {
              clientId: "client",
              clientSecret: "secret",
              accessToken: FAKE_ACCESS_TOKEN,
              refreshToken: "refresh",
              scope: "read",
              expiresAt: Date.now() + 3_600_000,
            },
          },
          {
            name: "imported_expired",
            config: { kind: "mcp", url: locked.mcpUrl },
            oauth: { clientId: "client", refreshToken: "refresh", expiresAt: 1 },
          },
          { name: "imported_cmd", config: { kind: "stdio", command: "echo" } },
        ],
      },
    });
    const { data } = await body<ImportView>(response);
    expect(data.imported).toEqual(["imported_locked", "imported_expired"]);
    expect(data.connected).toEqual(["imported_locked"]);
    expect(data.skipped.map((item) => item.name)).toEqual(["imported_cmd"]);
    const stored = findSource({ organizationId: account.organizationId, name: "imported_locked" });
    expect(stored.data?.oauth).toMatchObject({
      imported: true,
      client: { client_id: "client", client_secret: "secret" },
      tokens: { access_token: FAKE_ACCESS_TOKEN, refresh_token: "refresh", scope: "read" },
    });
    const expired = findSource({ organizationId: account.organizationId, name: "imported_expired" });
    expect(expired.data?.status).toBe("needs_auth");
  });

  test("imports from a client config file", async () => {
    const response = await call("/v1/sources/import", {
      method: "POST",
      cookie: account.cookie,
      json: { config: JSON.stringify({ mcpServers: { from_file: { url: open.mcpUrl } } }) },
    });
    const { data } = await body<ImportView>(response);
    expect(data).toEqual({ imported: ["from_file"], connected: ["from_file"], skipped: [] });
  });

  test("keeps a connected source untouched when it is imported again", async () => {
    const again = await call("/v1/sources/import", {
      method: "POST",
      cookie: account.cookie,
      json: {
        sources: [
          {
            name: "from_file",
            config: { kind: "mcp", url: locked.mcpUrl },
            oauth: { clientId: "stale", refreshToken: "stale", expiresAt: 1 },
          },
        ],
      },
    });
    const { data } = await body<ImportView>(again);
    expect(data).toEqual({ imported: ["from_file"], connected: ["from_file"], skipped: [] });
    const stored = findSource({ organizationId: account.organizationId, name: "from_file" });
    expect(stored.data?.config).toMatchObject({ url: open.mcpUrl });
    expect(stored.data?.oauth.imported).toBeUndefined();
  });

  test("rejects an invalid client config file", async () => {
    const response = await call("/v1/sources/import", {
      method: "POST",
      cookie: account.cookie,
      json: { config: "{oops" },
    });
    expect(response.status).toBe(400);
  });
});

describe("oauth start", () => {
  test("refuses oauth for non mcp sources", async () => {
    const response = await call("/v1/sources/inline_api/oauth", { method: "POST", cookie: account.cookie });
    expect((await body(response)).error?.code).toBe("OAUTH_UNSUPPORTED");
  });

  test("refuses oauth for unknown sources", async () => {
    const response = await call("/v1/sources/missing/oauth", { method: "POST", cookie: account.cookie });
    expect(response.status).toBe(404);
  });

  test("starts oauth and drops imported credentials", async () => {
    const response = await call("/v1/sources/imported_locked/oauth", { method: "POST", cookie: account.cookie });
    const { data } = await body<OAuthStartView>(response);
    expect(data.authorizationUrl).toStartWith(`${locked.base}/authorize`);
    const stored = findSource({ organizationId: account.organizationId, name: "imported_locked" });
    expect(stored.data?.oauth.imported).toBeUndefined();
    expect(stored.data?.oauth.tokens).toBeUndefined();
    expect(stored.data?.oauth.client?.client_id).toBe("fake-client");
    expect(stored.data?.oauth.verifier).toBeTruthy();
  });

  test("reports OAUTH_FAILED when discovery breaks", async () => {
    const down = closedUrl();
    await create("oauth_down", { kind: "mcp", url: down });
    const response = await call("/v1/sources/oauth_down/oauth", { method: "POST", cookie: account.cookie });
    expect((await body(response)).error?.code).toBe("OAUTH_FAILED");
  });
});
