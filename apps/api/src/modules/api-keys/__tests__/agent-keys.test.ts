import { beforeAll, expect, spyOn, test } from "bun:test";
import { type AgentApiKeyView, ok } from "@runelay/shared";
import { db } from "@/db/connection";
import * as apiKeyRepository from "@/modules/api-keys/repositories/api-key.repository";
import { findApiKeyIdsByName, findOrganizationOwner } from "@/modules/api-keys/repositories/api-key.repository";
import { issueAgentApiKey } from "@/modules/api-keys/services/api-key.service";
import { auth } from "@/modules/auth/lib/better-auth";
import { withQueryFault, withQueryFaultAsync } from "../../../../test/db-fault-helpers";
import { body, call, createApiKey, signUp, type TestAccount } from "../../../../test/helpers";

let account: TestAccount;
let computerKey: string;

const issue = (name: string, bearer = computerKey) =>
  call("/v1/api-keys/agent", { method: "POST", bearer, json: { name } });

const auditedPaths = (organizationId: string) =>
  db
    .query<{ path: string; status: number }, [string]>(
      "SELECT path, status FROM audit_events WHERE organization_id = ? AND path = '/v1/api-keys/agent'",
    )
    .all(organizationId);

beforeAll(async () => {
  account = await signUp("Agent Keys");
  computerKey = (await createApiKey(account, "andre@laptop")).key;
});

test("an api key creates a named agent key for the same organization", async () => {
  const response = await issue("Cursor · laptop");
  expect(response.status).toBe(201);
  const { data } = await body<AgentApiKeyView>(response);
  expect(data).toMatchObject({ name: "Cursor · laptop", recoverable: true, rotated: 0 });
  expect(data.key.startsWith("rnl_")).toBe(true);
  const status = await call("/v1/cli/status", { bearer: data.key });
  expect(status.status).toBe(200);
  expect(findApiKeyIdsByName(account.organizationId, "Cursor · laptop").data).toEqual([data.id]);
  expect(auditedPaths(account.organizationId).some((row) => row.status === 201)).toBe(true);
});

test("issuing the same name again rotates the key and revokes the old one", async () => {
  const first = (await body<AgentApiKeyView>(await issue("Codex · laptop"))).data;
  const second = (await body<AgentApiKeyView>(await issue("Codex · laptop"))).data;
  expect(second.rotated).toBe(1);
  expect(second.key).not.toBe(first.key);
  expect((await call("/v1/cli/status", { bearer: first.key })).status).toBe(401);
  expect((await call("/v1/cli/status", { bearer: second.key })).status).toBe(200);
  expect(findApiKeyIdsByName(account.organizationId, "Codex · laptop").data).toEqual([second.id]);
});

test("an agent key can rotate itself", async () => {
  const first = (await body<AgentApiKeyView>(await issue("Kimi Code · laptop"))).data;
  const second = (await body<AgentApiKeyView>(await issue("Kimi Code · laptop", first.key))).data;
  expect(second.rotated).toBe(1);
  expect((await call("/v1/cli/status", { bearer: second.key })).status).toBe(200);
});

test("keys with the same name in another organization are left alone", async () => {
  const other = await signUp("Other Agent Keys");
  const otherKey = (await createApiKey(other, "other@desk")).key;
  const theirs = (await body<AgentApiKeyView>(await issue("Grok · shared", otherKey))).data;
  const ours = (await body<AgentApiKeyView>(await issue("Grok · shared"))).data;
  expect(ours.rotated).toBe(0);
  expect((await call("/v1/cli/status", { bearer: theirs.key })).status).toBe(200);
});

test("the computer key checks an agent key without marking the agent key as used", async () => {
  const agent = (await body<AgentApiKeyView>(await issue("Gemini CLI · laptop"))).data;
  const check = (key: string, name = "Gemini CLI · laptop", bearer = computerKey) =>
    call("/v1/api-keys/agent/check", { method: "POST", bearer, json: { name, key } });
  const valid = await check(agent.key);
  expect(valid.status).toBe(200);
  expect((await body<{ valid: boolean }>(valid)).data).toEqual({ valid: true });
  expect((await body<{ valid: boolean }>(await check("rnl_wrong"))).data).toEqual({ valid: false });
  expect((await body<{ valid: boolean }>(await check(agent.key, "Cursor · other"))).data).toEqual({ valid: false });
  const lastRequest = db
    .query<{ lastRequest: string | null }, [string]>("SELECT lastRequest FROM apikey WHERE id = ?")
    .get(agent.id)?.lastRequest;
  expect(lastRequest ?? null).toBeNull();
  const session = await call("/v1/api-keys/agent/check", {
    method: "POST",
    cookie: account.cookie,
    json: { name: "x", key: "y" },
  });
  expect(session.status).toBe(401);
});

test("a panel session cannot use the agent endpoint", async () => {
  const response = await call("/v1/api-keys/agent", { method: "POST", cookie: account.cookie, json: { name: "x" } });
  expect(response.status).toBe(401);
  expect((await body(response)).error?.code).toBe("API_KEY_REQUIRED");
});

test("requests without credentials or with a blank name are rejected", async () => {
  const anonymous = await call("/v1/api-keys/agent", { method: "POST", json: { name: "x" } });
  expect(anonymous.status).toBe(401);
  expect((await body(anonymous)).error?.code).toBe("UNAUTHORIZED");
  const blank = await issue(" ");
  expect(blank.status).toBe(400);
  expect((await body(blank)).error?.code).toBe("INVALID_INPUT");
});

test("the session routes still require a session for bearer requests", async () => {
  const response = await call("/v1/api-keys", { bearer: computerKey });
  expect(response.status).toBe(401);
  expect((await body(response)).error?.code).toBe("SESSION_REQUIRED");
});

test("an organization without members cannot issue keys", async () => {
  expect(findOrganizationOwner("missing-org").error?.code).toBe("FORBIDDEN");
  expect((await issueAgentApiKey("missing-org", "Cursor · ghost")).error?.code).toBe("FORBIDDEN");
});

test("repository lookups report storage failures", () => {
  withQueryFault(
    (sql) => sql.includes("FROM apikey WHERE referenceId = ? AND name = ?") || sql.includes("FROM member"),
    () => {
      expect(findApiKeyIdsByName(account.organizationId, "x").error?.code).toBe("STORAGE_FAILED");
      expect(findOrganizationOwner(account.organizationId).error?.code).toBe("STORAGE_FAILED");
    },
  );
});

test("the service propagates lookup, owner and create failures", async () => {
  const lookup = await withQueryFaultAsync(
    (sql) => sql.includes("FROM apikey WHERE referenceId = ? AND name = ?"),
    () => issueAgentApiKey(account.organizationId, "OpenCode · laptop"),
  );
  expect(lookup.error?.code).toBe("STORAGE_FAILED");
  const owner = await withQueryFaultAsync(
    (sql) => sql.includes("FROM member WHERE organizationId = ? ORDER BY role"),
    () => issueAgentApiKey(account.organizationId, "OpenCode · laptop"),
  );
  expect(owner.error?.code).toBe("STORAGE_FAILED");
  const rejected = spyOn(auth.api, "createApiKey").mockRejectedValueOnce(new Error("boom"));
  try {
    expect((await issueAgentApiKey(account.organizationId, "OpenCode · laptop")).error?.code).toBe("STORAGE_FAILED");
  } finally {
    rejected.mockRestore();
  }
});

test("a failed revoke removes the new key and keeps the old one", async () => {
  const first = (await body<AgentApiKeyView>(await issue("Hermes Agent · laptop"))).data;
  let faults = 0;
  const result = await withQueryFaultAsync(
    (sql) => {
      if (!sql.includes("DELETE FROM api_key_secrets")) return false;
      faults += 1;
      return faults === 1;
    },
    () => issueAgentApiKey(account.organizationId, "Hermes Agent · laptop"),
  );
  expect(result.error?.code).toBe("STORAGE_FAILED");
  expect(findApiKeyIdsByName(account.organizationId, "Hermes Agent · laptop").data).toEqual([first.id]);
});

test("a key that disappeared before the revoke does not fail the rotation", async () => {
  const spy = spyOn(apiKeyRepository, "findApiKeyIdsByName").mockReturnValue(ok(["already-gone"]));
  try {
    const result = await issueAgentApiKey(account.organizationId, "OpenClaw · laptop");
    expect(result.error).toBeNull();
    expect(result.data?.rotated).toBe(1);
  } finally {
    spy.mockRestore();
  }
});
