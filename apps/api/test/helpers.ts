import { SETUP_TOKEN_HEADER } from "@runelay/shared";
import { app } from "@/app";
import { db } from "@/db/connection";
import { SETUP_TOKEN } from "@/modules/auth/lib/setup-token";

export const resetDatabase = () => {
  const tables = db
    .query<{ name: string }, []>(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND sql NOT LIKE 'CREATE VIRTUAL TABLE%' AND name NOT LIKE '%_fts_%'`,
    )
    .all();
  db.run("PRAGMA foreign_keys = OFF");
  for (const { name } of tables) db.run(`DELETE FROM "${name}"`);
  db.run("PRAGMA foreign_keys = ON");
};

let sequence = 0;

export type TestAccount = { userId: string; organizationId: string; email: string; cookie: string };

export const signUp = async (name = "Tester"): Promise<TestAccount> => {
  sequence += 1;
  const email = `user${sequence}-${crypto.randomUUID().slice(0, 8)}@runelay.test`;
  const response = await app.request("/v1/auth/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:4312", [SETUP_TOKEN_HEADER]: SETUP_TOKEN },
    body: JSON.stringify({ email, password: "senha-forte-123", name }),
  });
  if (!response.ok) throw new Error(`sign up failed: ${response.status} ${await response.text()}`);
  const cookie = response.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  const { user } = (await response.json()) as { user: { id: string } };
  const membership = db
    .query<{ organizationId: string }, [string]>(`SELECT organizationId FROM member WHERE userId = ? LIMIT 1`)
    .get(user.id);
  if (!membership) throw new Error("personal organization missing");
  return { userId: user.id, organizationId: membership.organizationId, email, cookie };
};

export const call = (path: string, init: RequestInit & { json?: unknown; cookie?: string; bearer?: string } = {}) => {
  const { json, cookie, bearer, headers, ...rest } = init;
  const merged = new Headers(headers);
  merged.set("origin", "http://localhost:4312");
  if (json !== undefined) merged.set("content-type", "application/json");
  if (cookie) merged.set("cookie", cookie);
  if (bearer) merged.set("authorization", `Bearer ${bearer}`);
  return app.request(path, { ...rest, headers: merged, body: json === undefined ? rest.body : JSON.stringify(json) });
};

export const body = async <T = unknown>(response: Response) =>
  (await response.json()) as { data: T; error: { code: string; message: string } | null };

export const createApiKey = async (account: TestAccount, name = "test") => {
  const response = await call("/v1/api-keys", { method: "POST", cookie: account.cookie, json: { name } });
  const { data } = await body<{ id: string; key: string }>(response);
  return data;
};
