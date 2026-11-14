import { beforeAll, expect, test } from "bun:test";
import { body, call, createApiKey, resetDatabase, signUp, type TestAccount } from "../../test/helpers";

let account: TestAccount;

beforeAll(async () => {
  resetDatabase();
  account = await signUp();
});

test("health answers ok", async () => {
  const response = await call("/health");
  expect(await response.text()).toBe("ok");
});

test("unknown api routes return NOT_FOUND", async () => {
  const response = await call("/v1/nope");
  expect(response.status).toBe(404);
  expect((await body(response)).error?.code).toBe("NOT_FOUND");
});

test("non api routes fall back to the web index", async () => {
  const response = await call("/some/page");
  expect(await response.text()).toContain("<title>runelay</title>");
});

test("session cookie and api key both authenticate", async () => {
  const me = await call("/v1/me", { cookie: account.cookie });
  expect(me.status).toBe(200);
  const key = await createApiKey(account);
  expect(key.key.startsWith("rnl_")).toBe(true);
  const memories = await call("/v1/memories", { bearer: key.key });
  expect(memories.status).toBe(200);
});
