import { afterEach, beforeAll, describe, expect, spyOn, test } from "bun:test";
import type { CliAuthPollView, CliAuthRequestView, CliAuthStartView, CliStatusView } from "@runelay/shared";
import { db } from "@/db/connection";
import * as apiKeyService from "@/modules/api-keys/services/api-key.service";
import { findCliStatus } from "@/modules/cli/repositories/cli-auth.repository";
import { approveCliAuth, findCliAuthRequest, pollCliAuth, startCliAuth } from "@/modules/cli/services/cli-auth.service";
import { withQueryFault, withQueryFaultAsync } from "../../../../test/db-fault-helpers";
import { body, call, resetDatabase, signUp, type TestAccount } from "../../../../test/helpers";

let account: TestAccount;
let other: TestAccount;

const uniqueIp = () =>
  `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;

const start = async (device = "laptop", ip = uniqueIp()) => {
  const response = await call("/v1/cli/auth", { method: "POST", json: { device }, headers: { "x-forwarded-for": ip } });
  return { response, ...(await body<CliAuthStartView>(response)) };
};

const poll = async (pollToken: string) => body<CliAuthPollView>(await call(`/v1/cli/auth/${pollToken}`));

const approve = (code: string, cookie = account.cookie) =>
  call("/v1/cli/auth/approve", { method: "POST", cookie, json: { code } });

const rowOf = (code: string) =>
  db
    .query<{ status: string; organization_id: string | null; api_key: string | null }, [string]>(
      "SELECT status, organization_id, api_key FROM cli_auth_requests WHERE code = ?",
    )
    .get(code);

beforeAll(async () => {
  resetDatabase();
  account = await signUp("Cli Owner");
  other = await signUp("Cli Other");
});

afterEach(() => {
  db.query("DELETE FROM cli_auth_requests").run();
});

describe("start", () => {
  test("creates a pending request with a verification url", async () => {
    const { response, data } = await start("my laptop");
    expect(response.status).toBe(201);
    expect(data.code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(data.verificationUrl).toBe(`http://localhost:4312/cli/authorize?code=${data.code}`);
    expect(data.intervalSeconds).toBe(2);
    expect(rowOf(data.code)?.status).toBe("pending");
  });

  test("rejects an empty device", async () => {
    const response = await call("/v1/cli/auth", { method: "POST", json: { device: " " } });
    expect(response.status).toBe(400);
  });

  test("rate limits by client ip and falls back to a local bucket without ip headers", async () => {
    const ip = uniqueIp();
    for (let index = 0; index < 10; index += 1) expect((await start("rl", ip)).response.status).toBe(201);
    const blocked = await start("rl", ip);
    expect(blocked.response.status).toBe(429);
    expect(blocked.error?.code).toBe("CLI_AUTH_RATE_LIMITED");
    expect(Number(blocked.response.headers.get("retry-after"))).toBeGreaterThan(0);
    const local = await call("/v1/cli/auth", { method: "POST", json: { device: "no-ip" } });
    expect([201, 429]).toContain(local.status);
  });

  test("purges expired requests on insert", () => {
    db.query(
      "INSERT INTO cli_auth_requests (code, poll_token_hash, device, expires_at) VALUES ('OLDX-OLDX', 'old-hash', 'old', '2000-01-01T00:00:00.000Z')",
    ).run();
    expect(startCliAuth({ device: "fresh" }).error).toBeNull();
    expect(rowOf("OLDX-OLDX")).toBeNull();
  });

  test("returns STORAGE_FAILED when the insert throws", () => {
    const result = withQueryFault(
      (sql) => sql.includes("INSERT OR IGNORE INTO cli_auth_requests"),
      () => startCliAuth({ device: "x" }),
    );
    expect(result.error?.code).toBe("STORAGE_FAILED");
  });

  test("gives up after repeated code collisions", () => {
    const result = withQueryFault(
      (sql) => sql.includes("INSERT OR IGNORE INTO cli_auth_requests"),
      () => startCliAuth({ device: "x" }),
      () => ({ run: () => ({ changes: 0 }) }),
    );
    expect(result.error?.code).toBe("STORAGE_FAILED");
    expect(result.error?.message).toContain("código livre");
  });
});

describe("request lookup", () => {
  test("finds a pending request by lowercased code", async () => {
    const { data } = await start("desk");
    const response = await call(`/v1/cli/auth/requests/${data.code.toLowerCase()}`, { cookie: account.cookie });
    const result = await body<CliAuthRequestView>(response);
    expect(response.status).toBe(200);
    expect(result.data.device).toBe("desk");
  });

  test("requires a session", async () => {
    const response = await call("/v1/cli/auth/requests/ABCD-EFGH");
    expect((await body(response)).error?.code).toBe("SESSION_REQUIRED");
  });

  test("returns CLI_AUTH_NOT_FOUND for an unknown code", async () => {
    const response = await call("/v1/cli/auth/requests/ZZZZ-ZZZZ", { cookie: account.cookie });
    expect(response.status).toBe(404);
    expect((await body(response)).error?.code).toBe("CLI_AUTH_NOT_FOUND");
  });

  test("returns CLI_AUTH_NOT_FOUND for an expired code", async () => {
    const { data } = await start();
    db.query("UPDATE cli_auth_requests SET expires_at = '2000-01-01T00:00:00.000Z' WHERE code = ?").run(data.code);
    const response = await call(`/v1/cli/auth/requests/${data.code}`, { cookie: account.cookie });
    expect((await body(response)).error?.code).toBe("CLI_AUTH_NOT_FOUND");
  });

  test("returns STORAGE_FAILED when the lookup throws", async () => {
    const { data } = await start();
    const result = withQueryFault(
      (sql) => sql.includes("SELECT code, device"),
      () => findCliAuthRequest(data.code),
    );
    expect(result.error?.code).toBe("STORAGE_FAILED");
  });
});

describe("approve and poll", () => {
  test("full flow hands the key out exactly once", async () => {
    const { data } = await start("workstation");
    expect((await poll(data.pollToken)).data.status).toBe("pending");
    const approved = await approve(data.code.toLowerCase());
    expect(approved.status).toBe(200);
    expect((await body<CliAuthRequestView>(approved)).data.device).toBe("workstation");
    expect(rowOf(data.code)?.organization_id).toBe(account.organizationId);
    const first = await poll(data.pollToken);
    expect(first.data.status).toBe("approved");
    expect(first.data.apiKey?.startsWith("rnl_")).toBe(true);
    expect(first.data.organizationName).toBeTruthy();
    const keys = db
      .query<{ name: string }, [string]>("SELECT name FROM apikey WHERE referenceId = ?")
      .all(account.organizationId);
    expect(keys.some((key) => key.name === "CLI workstation")).toBe(true);
    expect(rowOf(data.code)?.status).toBe("consumed");
    expect(rowOf(data.code)?.api_key).toBeNull();
    const second = await poll(data.pollToken);
    expect(second.data).toEqual({ status: "expired", apiKey: null, organizationName: null });
  });

  test("the issued key authenticates cli status and can delete itself", async () => {
    const { data } = await start("status-box");
    await approve(data.code);
    const key = (await poll(data.pollToken)).data.apiKey as string;
    const status = await call("/v1/cli/status", { bearer: key });
    const view = await body<CliStatusView>(status);
    expect(status.status).toBe(200);
    expect(view.data).toMatchObject({ sources: 0, memories: 0, skills: 0 });
    const removed = await call("/v1/cli/key", { method: "DELETE", bearer: key });
    expect(removed.status).toBe(200);
    expect((await call("/v1/cli/status", { bearer: key })).status).toBe(401);
  });

  test("deleting the key needs an api key, not a session", async () => {
    const response = await call("/v1/cli/key", { method: "DELETE", cookie: account.cookie });
    expect(response.status).toBe(401);
    expect((await body(response)).error?.code).toBe("API_KEY_REQUIRED");
  });

  test("status works with a session too", async () => {
    const response = await call("/v1/cli/status", { cookie: other.cookie });
    expect(response.status).toBe(200);
  });

  test("an already used code cannot be approved again", async () => {
    const { data } = await start();
    expect((await approve(data.code)).status).toBe(200);
    const again = await approve(data.code, other.cookie);
    expect(again.status).toBe(404);
    expect((await body(again)).error?.code).toBe("CLI_AUTH_NOT_FOUND");
    expect(rowOf(data.code)?.organization_id).toBe(account.organizationId);
  });

  test("approval binds the key to the approver organization", async () => {
    const { data } = await start();
    await approve(data.code, other.cookie);
    const result = await poll(data.pollToken);
    const status = await body<CliStatusView>(await call("/v1/cli/status", { bearer: result.data.apiKey as string }));
    const otherStatus = await body<CliStatusView>(await call("/v1/cli/status", { cookie: other.cookie }));
    expect(status.data.organizationName).toBe(otherStatus.data.organizationName);
    expect(rowOf(data.code)?.organization_id).toBe(other.organizationId);
  });

  test("an expired code cannot be approved and polls as expired", async () => {
    const { data } = await start();
    db.query("UPDATE cli_auth_requests SET expires_at = '2000-01-01T00:00:00.000Z' WHERE code = ?").run(data.code);
    expect((await approve(data.code)).status).toBe(404);
    expect((await poll(data.pollToken)).data.status).toBe("expired");
  });

  test("approve validates the code shape and requires a session", async () => {
    expect((await approve("bad")).status).toBe(400);
    const anonymous = await call("/v1/cli/auth/approve", { method: "POST", json: { code: "ABCD-EFGH" } });
    expect((await body(anonymous)).error?.code).toBe("SESSION_REQUIRED");
  });

  test("an unknown poll token is expired", async () => {
    expect((await poll("does-not-exist")).data.status).toBe("expired");
  });

  test("an approved row without a key polls as expired", async () => {
    const { data } = await start();
    db.query(
      "UPDATE cli_auth_requests SET status = 'approved', organization_id = ?, api_key = NULL WHERE code = ?",
    ).run(account.organizationId, data.code);
    expect((await poll(data.pollToken)).data).toEqual({ status: "expired", apiKey: null, organizationName: null });
  });

  test("a corrupted sealed key surfaces STORAGE_FAILED", async () => {
    const { data } = await start();
    db.query(
      "UPDATE cli_auth_requests SET status = 'approved', organization_id = ?, api_key = 'not-a-sealed-blob' WHERE code = ?",
    ).run(account.organizationId, data.code);
    expect((await poll(data.pollToken)).error?.code).toBe("STORAGE_FAILED");
  });
});

describe("storage failures", () => {
  test("poll fails when the status lookup throws", async () => {
    const { data } = await start();
    const result = withQueryFault(
      (sql) => sql.includes("SELECT CASE WHEN status"),
      () => pollCliAuth(data.pollToken),
    );
    expect(result.error?.code).toBe("STORAGE_FAILED");
  });

  test("poll fails when consuming throws", async () => {
    const { data } = await start();
    await approve(data.code);
    const result = withQueryFault(
      (sql) => sql.includes("SELECT r.api_key"),
      () => pollCliAuth(data.pollToken),
    );
    expect(result.error?.code).toBe("STORAGE_FAILED");
    expect(rowOf(data.code)?.status).toBe("approved");
  });

  test("approve fails when the key cannot be created", async () => {
    const { data } = await start();
    const spy = spyOn(apiKeyService, "createApiKey").mockResolvedValue({
      data: null,
      error: { code: "STORAGE_FAILED", message: "boom" },
    } as Awaited<ReturnType<typeof apiKeyService.createApiKey>>);
    try {
      const result = await approveCliAuth(account.organizationId, account.userId, data.code);
      expect(result.error?.code).toBe("STORAGE_FAILED");
    } finally {
      spy.mockRestore();
    }
    expect(rowOf(data.code)?.status).toBe("pending");
  });

  test("approve rolls the key back when marking approved throws", async () => {
    const { data } = await start("rollback-throw");
    const result = await withQueryFaultAsync(
      (sql) => sql.includes("SET status = 'approved'"),
      () => approveCliAuth(account.organizationId, account.userId, data.code),
    );
    expect(result.error?.code).toBe("STORAGE_FAILED");
    const keys = db
      .query<{ id: string }, [string, string]>("SELECT id FROM apikey WHERE referenceId = ? AND name = ?")
      .all(account.organizationId, "CLI rollback-throw");
    expect(keys).toHaveLength(0);
  });

  test("approve rolls the key back when the request expires mid-approval", async () => {
    const { data } = await start("rollback-race");
    const original = apiKeyService.createApiKey;
    const spy = spyOn(apiKeyService, "createApiKey").mockImplementation(async (...args) => {
      const created = await original(...args);
      db.query("UPDATE cli_auth_requests SET expires_at = '2000-01-01T00:00:00.000Z' WHERE code = ?").run(data.code);
      return created;
    });
    try {
      const result = await approveCliAuth(account.organizationId, account.userId, data.code);
      expect(result.error?.code).toBe("CLI_AUTH_NOT_FOUND");
    } finally {
      spy.mockRestore();
    }
    const keys = db
      .query<{ id: string }, [string, string]>("SELECT id FROM apikey WHERE referenceId = ? AND name = ?")
      .all(account.organizationId, "CLI rollback-race");
    expect(keys).toHaveLength(0);
  });

  test("cli status is FORBIDDEN for a missing organization and STORAGE_FAILED when the query throws", () => {
    expect(findCliStatus("missing-org").error?.code).toBe("FORBIDDEN");
    const result = withQueryFault(
      (sql) => sql.includes("AS organizationName"),
      () => findCliStatus(account.organizationId),
    );
    expect(result.error?.code).toBe("STORAGE_FAILED");
  });
});
