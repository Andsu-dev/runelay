import { beforeAll, expect, spyOn, test } from "bun:test";
import type { ApiKeyView, AuditEventView, Page } from "@runelay/shared";
import { db } from "@/db/connection";
import {
  deleteApiKeyRow,
  findApiKeySecret,
  findApiKeyView,
  listApiKeyViews,
  saveApiKeySecret,
} from "@/modules/api-keys/repositories/api-key.repository";
import { listKeyActivity, recordAuditEvent } from "@/modules/api-keys/repositories/audit.repository";
import { createApiKey as createApiKeyService } from "@/modules/api-keys/services/api-key.service";
import { auth } from "@/modules/auth/lib/better-auth";
import { body, call, createApiKey, signUp, type TestAccount } from "../../../../test/helpers";

let account: TestAccount;

beforeAll(async () => {
  account = await signUp("Chaves");
});

test("creates an api key and lists it as recoverable", async () => {
  const response = await call("/v1/api-keys", { method: "POST", cookie: account.cookie, json: { name: "primeira" } });
  expect(response.status).toBe(201);
  const created = (await body<ApiKeyView & { key: string }>(response)).data;
  expect(created.key.startsWith("rnl_")).toBe(true);
  expect(created.recoverable).toBe(true);
  const list = await call("/v1/api-keys", { cookie: account.cookie });
  const keys = (await body<ApiKeyView[]>(list)).data;
  expect(keys.find((key) => key.id === created.id)).toMatchObject({ name: "primeira", recoverable: true });
});

test("rejects an empty key name", async () => {
  const response = await call("/v1/api-keys", { method: "POST", cookie: account.cookie, json: { name: " " } });
  expect(response.status).toBe(400);
  expect((await body(response)).error?.code).toBe("INVALID_INPUT");
});

test("reveals the secret of a key created through the vault", async () => {
  const created = await createApiKey(account, "revelar");
  const response = await call(`/v1/api-keys/${created.id}/secret`, { cookie: account.cookie });
  expect((await body<{ key: string }>(response)).data.key).toBe(created.key);
});

test("keys created outside the vault are listed as not recoverable and cannot be revealed", async () => {
  const legacy = await auth.api.createApiKey({
    body: { name: "antiga", organizationId: account.organizationId, userId: account.userId },
  });
  const list = await body<ApiKeyView[]>(await call("/v1/api-keys", { cookie: account.cookie }));
  expect(list.data.find((key) => key.id === legacy.id)?.recoverable).toBe(false);
  const response = await call(`/v1/api-keys/${legacy.id}/secret`, { cookie: account.cookie });
  expect(response.status).toBe(404);
  expect((await body(response)).error?.code).toBe("API_KEY_NOT_FOUND");
});

test("a corrupted sealed secret fails with STORAGE_FAILED", async () => {
  const created = await createApiKey(account, "corrompida");
  db.query("UPDATE api_key_secrets SET sealed = ? WHERE key_id = ?").run("bm9wZQ==", created.id);
  const response = await call(`/v1/api-keys/${created.id}/secret`, { cookie: account.cookie });
  expect(response.status).toBe(500);
  expect((await body(response)).error?.code).toBe("STORAGE_FAILED");
});

test("deletes a key and its secret, then reports it as missing", async () => {
  const created = await createApiKey(account, "apagar");
  const deleted = await call(`/v1/api-keys/${created.id}`, { method: "DELETE", cookie: account.cookie });
  expect(deleted.status).toBe(200);
  expect(db.query("SELECT 1 FROM api_key_secrets WHERE key_id = ?").get(created.id)).toBeNull();
  const again = await call(`/v1/api-keys/${created.id}`, { method: "DELETE", cookie: account.cookie });
  expect(again.status).toBe(404);
  expect((await body(again)).error?.code).toBe("API_KEY_NOT_FOUND");
});

test("keys of another organization are invisible", async () => {
  const other = await signUp("Outra Org");
  const created = await createApiKey(other, "alheia");
  const response = await call(`/v1/api-keys/${created.id}/secret`, { cookie: account.cookie });
  expect(response.status).toBe(404);
  expect(findApiKeyView(account.organizationId, created.id).error?.code).toBe("API_KEY_NOT_FOUND");
});

test("activity merges http and tool calls and paginates", async () => {
  const created = await createApiKey(account, "atividade");
  await call("/v1/memories", { bearer: created.key, headers: { "cf-connecting-ip": "198.51.100.1" } });
  await call("/v1/does-not-exist", { bearer: created.key });
  db.query(
    "INSERT INTO tool_calls (organization_id, api_key_id, source, tool, ok, duration_ms, created_at) VALUES (?, ?, 'github', 'list_issues', 1, 12, '2000-01-01T00:00:00.000Z')",
  ).run(account.organizationId, created.id);
  const first = await call(`/v1/api-keys/${created.id}/activity?limit=2`, { cookie: account.cookie });
  const page = (await body<Page<AuditEventView>>(first)).data;
  expect(page.total).toBe(2);
  expect(page.nextCursor).toBeNull();
  expect(page.items.every((item) => typeof item.ok === "boolean")).toBe(true);
  const smaller = await call(`/v1/api-keys/${created.id}/activity?limit=1`, { cookie: account.cookie });
  const firstPage = (await body<Page<AuditEventView>>(smaller)).data;
  expect(firstPage.items).toHaveLength(1);
  expect(firstPage.nextCursor).toBe(1);
  const last = await call(`/v1/api-keys/${created.id}/activity?limit=1&cursor=1`, { cookie: account.cookie });
  const lastPage = (await body<Page<AuditEventView>>(last)).data;
  expect(lastPage.items[0]).toMatchObject({ kind: "tool", action: "github.list_issues", ok: true, durationMs: 12 });
  expect(lastPage.nextCursor).toBeNull();
});

test("activity rejects an invalid limit", async () => {
  const response = await call("/v1/api-keys/any/activity?limit=0", { cookie: account.cookie });
  expect(response.status).toBe(400);
});

test("repositories report storage failures", async () => {
  const spy = spyOn(db, "query").mockImplementation(() => {
    throw new Error("disk");
  });
  try {
    expect(listApiKeyViews(account.organizationId).error?.code).toBe("STORAGE_FAILED");
    expect(findApiKeyView(account.organizationId, "x").error?.code).toBe("STORAGE_FAILED");
    expect(saveApiKeySecret(account.organizationId, "x", "y").error?.code).toBe("STORAGE_FAILED");
    expect(findApiKeySecret(account.organizationId, "x").error?.code).toBe("STORAGE_FAILED");
    expect(deleteApiKeyRow(account.organizationId, "x").error?.code).toBe("STORAGE_FAILED");
    expect(listKeyActivity(account.organizationId, "x", 0, 10).error?.code).toBe("STORAGE_FAILED");
    expect(
      recordAuditEvent({ organizationId: "o", apiKeyId: null, method: "GET", path: "/", status: 200, ip: null }).error
        ?.code,
    ).toBe("STORAGE_FAILED");
  } finally {
    spy.mockRestore();
  }
});

test("createApiKey service propagates failures", async () => {
  const rejected = spyOn(auth.api, "createApiKey").mockRejectedValueOnce(new Error("boom"));
  try {
    const result = await createApiKeyService(account.organizationId, account.userId, "falha");
    expect(result.error?.code).toBe("STORAGE_FAILED");
  } finally {
    rejected.mockRestore();
  }
  db.run("CREATE TEMP TRIGGER block_secret BEFORE INSERT ON api_key_secrets BEGIN SELECT RAISE(ABORT, 'blocked'); END");
  try {
    const result = await createApiKeyService(account.organizationId, account.userId, "sem-cofre");
    expect(result.error?.code).toBe("STORAGE_FAILED");
  } finally {
    db.run("DROP TRIGGER IF EXISTS temp.block_secret");
  }
});
