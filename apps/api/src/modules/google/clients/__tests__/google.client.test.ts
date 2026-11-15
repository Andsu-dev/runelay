import { afterAll, beforeAll, beforeEach, expect, test } from "bun:test";
import type { GoogleConfig } from "@runelay/shared";
import { connectSource, disconnectSource, findTool } from "@/modules/connectors/services/connection.service";
import { connectGoogle } from "@/modules/google/clients/google.client";
import { scopesFor } from "@/modules/google/utils/google-scopes";
import { findSourceView, updateOAuth, upsertSource } from "@/modules/sources/repositories/source.repository";
import { type FakeGoogle, startFakeGoogle } from "../../../../../test/google-helpers";
import { signUp, type TestAccount } from "../../../../../test/helpers";

const CONFIG: GoogleConfig = { kind: "google", services: ["calendar", "docs", "gmail"] };

let account: TestAccount;
let google: FakeGoogle;
let restore: () => void;

const key = () => ({ organizationId: account.organizationId, name: "google" });

const grant = (services = CONFIG.services) =>
  updateOAuth(key(), {
    tokens: { access_token: "mcp-token", token_type: "Bearer" },
    google: { scopes: scopesFor(services) },
  });

beforeAll(async () => {
  google = startFakeGoogle();
  restore = google.install();
  account = await signUp("Google Client");
});

beforeEach(async () => {
  await disconnectSource(key());
  upsertSource(account.organizationId, { name: "google", config: CONFIG });
  updateOAuth(key(), { tokens: undefined, google: undefined });
  google.failingHosts.clear();
});

afterAll(() => {
  restore();
  google.stop();
});

test("needs auth until every selected service is granted", async () => {
  const result = await connectGoogle(key(), CONFIG);
  expect(result.error).toMatchObject({
    code: "NEEDS_AUTH",
    message: "Conecte o Google para liberar: Agenda, Docs, Gmail.",
  });
  grant(["gmail"]);
  expect((await connectGoogle(key(), CONFIG)).error?.message).toBe("Conecte o Google para liberar: Agenda, Docs.");
  await connectSource(key());
  expect(findSourceView(key()).data).toMatchObject({
    status: "needs_auth",
    error: "Conecte o Google para liberar: Agenda, Docs.",
    google: { email: null, grantedServices: ["gmail"] },
  });
  expect((await connectGoogle({ organizationId: account.organizationId, name: "nope" }, CONFIG)).error?.code).toBe(
    "SOURCE_NOT_FOUND",
  );
});

test("fails when the token cannot be refreshed", async () => {
  updateOAuth(key(), {
    tokens: { access_token: "old", token_type: "Bearer" },
    google: { scopes: scopesFor(CONFIG.services), expiresAt: 1 },
  });
  expect((await connectGoogle(key(), CONFIG)).error?.code).toBe("NEEDS_AUTH");
});

test("proxies the remote MCP tools with the service prefix and adds REST tools for selected services", async () => {
  grant();
  const connection = await connectGoogle(key(), CONFIG);
  if (connection.error) throw new Error(connection.error.message);
  const names = connection.data.tools.map((tool) => tool.name).sort();
  expect(names).toEqual([
    "account_whoami",
    "calendar_list_events",
    "docs_create_document",
    "docs_list_events",
    "gmail_send_email",
  ]);
  expect(connection.data.warning).toBeUndefined();
  const calendar = connection.data.tools.find((tool) => tool.name === "calendar_list_events");
  expect((await calendar?.call({ text: "hoje" }))?.data).toBe("calendarmcp.googleapis.com:hoje");
  expect(google.last("calendarmcp.googleapis.com")).toMatchObject({
    path: "/mcp/v1",
    authorization: "Bearer mcp-token",
  });
  updateOAuth(key(), { tokens: undefined });
  const revoked = await calendar?.call({ text: "x" });
  expect(revoked?.error?.message).toContain("Conecte o Google");
  await connection.data.close();
});

test("a Google MCP server that fails is reported without dropping the other tools", async () => {
  grant();
  google.failingHosts.add("docsmcp.googleapis.com");
  expect((await connectSource(key())).error).toBeNull();
  const view = findSourceView(key()).data;
  expect(view?.status).toBe("ok");
  expect(view?.error).toStartWith("Não foi possível carregar: Docs (");
  expect(view?.toolCount).toBe(4);
  const tool = await findTool(account.organizationId, "google.calendar_list_events");
  expect(tool.data?.source).toBe("google");
  expect((await findTool(account.organizationId, "google.docs_list_events")).error?.code).toBe("TOOL_NOT_FOUND");
});
