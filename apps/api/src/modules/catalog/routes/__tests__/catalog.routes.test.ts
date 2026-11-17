import { afterEach, beforeAll, expect, spyOn, test } from "bun:test";
import type { CatalogView, SourceView } from "@runelay/shared";
import { CATALOG, CATALOG_BY_URL_HASH } from "@/modules/catalog/constants/catalog.constants";
import { GOOGLE_SOURCE_URL } from "@/modules/google/constants/google.constants";
import { GITHUB_BROKER_CLIENT_ID } from "@/modules/oauth/constants/oauth.constants";
import { findSource } from "@/modules/sources/repositories/source.repository";
import { hashUrl } from "@/modules/sources/utils/url-hash";
import { body, call, signUp, type TestAccount } from "../../../../../test/helpers";
import { withEnv } from "../../../../../test/sources-helpers";

let account: TestAccount;
const restores: (() => void)[] = [];

beforeAll(async () => {
  account = await signUp("Catalog Owner");
});

afterEach(() => {
  for (const restore of restores.splice(0).reverse()) restore();
});

const offline = () => {
  restores.push(withEnv("RUNELAY_ALLOW_PRIVATE_URLS", true));
  const spy = spyOn(globalThis, "fetch").mockImplementation(
    Object.assign(() => Promise.reject(new Error("offline")), { preconnect: globalThis.fetch.preconnect }),
  );
  restores.push(() => spy.mockRestore());
};

const items = (view: CatalogView) => view.sections.flatMap((section) => section.items);

test("lists every catalog item as not installed", async () => {
  const response = await call("/v1/catalog", { cookie: account.cookie });
  const { data } = await body<CatalogView>(response);
  expect(items(data)).toHaveLength(CATALOG.flatMap((section) => section.items).length);
  expect(items(data).every((item) => !item.installed && item.sourceName === null && item.status === null)).toBe(true);
});

test("filters by accent insensitive terms and drops empty sections", async () => {
  const response = await call(`/v1/catalog?query=${encodeURIComponent("REPOSITÓRIOS github")}`, {
    cookie: account.cookie,
  });
  const { data } = await body<CatalogView>(response);
  expect(items(data).map((item) => item.id)).toEqual(["github"]);
  expect(data.sections).toHaveLength(1);
  const none = await body<CatalogView>(await call("/v1/catalog?query=zzzz-nada", { cookie: account.cookie }));
  expect(none.data.sections).toEqual([]);
});

test("installs a catalog item and marks it installed", async () => {
  offline();
  const response = await call("/v1/catalog/install", {
    method: "POST",
    cookie: account.cookie,
    json: { id: "linear" },
  });
  expect(response.status).toBe(201);
  const { data } = await body<SourceView>(response);
  expect(data.name).toBe("linear");
  expect(data.status).toBe("error");
  expect(data.icon).toBe("linear");
  const listed = await body<CatalogView>(await call("/v1/catalog?query=linear", { cookie: account.cookie }));
  expect(items(listed.data)[0]).toMatchObject({ installed: true, sourceName: "linear", status: "error" });
});

test("Conty is the featured OAuth connector and the only featured item", async () => {
  const { data } = await body<CatalogView>(await call("/v1/catalog", { cookie: account.cookie }));
  const featured = items(data).filter((item) => item.featured);
  expect(featured.map((item) => item.id)).toEqual(["conty"]);
  expect(featured[0]).toMatchObject({
    url: "https://mcp.appconty.com/mcp",
    icon: "/logos/conty.png",
    auth: "oauth",
    tokenUrl: null,
  });
  expect(
    items(data)
      .filter((item) => item.id !== "conty")
      .every((item) => item.featured === false),
  ).toBe(true);
  const catalog = JSON.parse(CATALOG_BY_URL_HASH) as Record<string, { icon: string; auth: string }>;
  expect(catalog[hashUrl("https://mcp.appconty.com/mcp")]).toMatchObject({ icon: "/logos/conty.png", auth: "oauth" });
});

test("rejects unknown catalog ids", async () => {
  const response = await call("/v1/catalog/install", { method: "POST", cookie: account.cookie, json: { id: "nope" } });
  expect(response.status).toBe(404);
  expect((await body(response)).error?.code).toBe("CATALOG_ITEM_NOT_FOUND");
});

test("catalog map is keyed by normalized url hash", () => {
  const catalog = JSON.parse(CATALOG_BY_URL_HASH) as Record<string, { icon: string; auth: string }>;
  expect(catalog[hashUrl("HTTPS://mcp.linear.app/mcp/ ")]).toMatchObject({ icon: "linear", auth: "oauth" });
});

test("installs a token connector with the token as a bearer header", async () => {
  offline();
  const response = await call("/v1/catalog/install", {
    method: "POST",
    cookie: account.cookie,
    json: { id: "buffer", token: "buf_test" },
  });
  const { data } = await body<SourceView>(response);
  expect(response.status).toBe(201);
  expect(data.config).toMatchObject({ kind: "mcp", headers: { Authorization: "Bearer buf_test" } });
  expect(data).toMatchObject({ auth: "api_key", tokenUrl: "https://publish.buffer.com/settings/api" });
});

test("GitHub is a one click OAuth connector through the broker", async () => {
  offline();
  const github = CATALOG.flatMap((section) => section.items).find((candidate) => candidate.id === "github");
  expect(github).toMatchObject({
    auth: "oauth",
    url: "https://api.githubcopilot.com/mcp/",
    broker: { provider: "github", clientId: GITHUB_BROKER_CLIENT_ID, scopes: ["repo", "read:user"] },
  });
  expect(github?.tokenUrl).toBeUndefined();
  const response = await call("/v1/catalog/install", {
    method: "POST",
    cookie: account.cookie,
    json: { id: "github" },
  });
  expect(response.status).toBe(201);
  const { data } = await body<SourceView>(response);
  expect(data).toMatchObject({ name: "github", icon: "github", auth: "oauth", tokenUrl: null });
  expect(findSource({ organizationId: account.organizationId, name: "github" }).data?.oauth.broker).toEqual(
    github?.broker,
  );
  expect(findSource({ organizationId: account.organizationId, name: "linear" }).data?.oauth.broker).toBeUndefined();
});

test("a pasted GitHub token keeps working without the broker", async () => {
  offline();
  await call("/v1/sources/github", { method: "DELETE", cookie: account.cookie });
  const response = await call("/v1/catalog/install", {
    method: "POST",
    cookie: account.cookie,
    json: { id: "github", token: "ghp_test" },
  });
  expect((await body<SourceView>(response)).data.config).toMatchObject({
    headers: { Authorization: "Bearer ghp_test" },
  });
  expect(findSource({ organizationId: account.organizationId, name: "github" }).data?.oauth.broker).toBeUndefined();
});

test("Google is one catalog item per service: Agenda and Gmail are popular, the rest lead the work section", () => {
  const popular = CATALOG.find((section) => section.id === "popular");
  expect(popular?.items.slice(0, 5).map((item) => item.id)).toEqual([
    "conty",
    "linear",
    "github",
    "google_calendar",
    "gmail",
  ]);
  const work = CATALOG.find((section) => section.id === "work");
  const workGoogle = work?.items.filter((item) => item.googleService) ?? [];
  expect(work?.items.slice(0, workGoogle.length)).toEqual(workGoogle);
  const google = CATALOG.flatMap((section) => section.items).filter((item) => item.googleService);
  expect(google.map((item) => [item.id, item.googleService, item.icon])).toEqual([
    ["google_calendar", "calendar", "googlecalendar"],
    ["gmail", "gmail", "gmail"],
    ["google_drive", "drive", "googledrive"],
    ["google_docs", "docs", "googledocs"],
    ["google_sheets", "sheets", "googlesheets"],
    ["google_slides", "slides", "googleslides"],
    ["google_forms", "forms", "googleforms"],
    ["google_meet", "meet", "googlemeet"],
  ]);
  expect(google.every((item) => item.auth === "oauth" && !item.broker)).toBe(true);
  expect(new Set(google.map((item) => hashUrl(item.url))).size).toBe(google.length);
});

test("installing a Google item creates a source with only its service and marks only that item", async () => {
  const response = await call("/v1/catalog/install", {
    method: "POST",
    cookie: account.cookie,
    json: { id: "gmail" },
  });
  expect(response.status).toBe(201);
  const { data } = await body<SourceView>(response);
  expect(data).toMatchObject({
    name: "gmail",
    status: "needs_auth",
    icon: "gmail",
    auth: "oauth",
    config: { kind: "google", services: ["gmail"] },
  });
  const listed = items((await body<CatalogView>(await call("/v1/catalog", { cookie: account.cookie }))).data);
  expect(listed.find((item) => item.id === "gmail")).toMatchObject({
    installed: true,
    sourceName: "gmail",
    status: "needs_auth",
  });
  expect(listed.find((item) => item.id === "google_drive")?.installed).toBe(false);
});

test("installing a Google item with explicit services keeps them", async () => {
  const response = await call("/v1/catalog/install", {
    method: "POST",
    cookie: account.cookie,
    json: { id: "google_meet", services: ["meet", "gmail", "meet"] },
  });
  expect((await body<SourceView>(response)).data).toMatchObject({
    config: { kind: "google", services: ["meet", "gmail"] },
    icon: "google",
  });
  const listed = items((await body<CatalogView>(await call("/v1/catalog", { cookie: account.cookie }))).data);
  expect(listed.find((item) => item.id === "google_meet")?.installed).toBe(false);
  const multi = JSON.parse(CATALOG_BY_URL_HASH)[hashUrl(GOOGLE_SOURCE_URL)];
  expect(multi).toEqual({ icon: "google", auth: "oauth", tokenUrl: null });
});

test("installing a Google item rejects unknown services", async () => {
  const response = await call("/v1/catalog/install", {
    method: "POST",
    cookie: account.cookie,
    json: { id: "google_meet", services: ["youtube"] },
  });
  expect(response.status).toBe(400);
});

test("v0.5.0 Google sources installed as MCP still show under their item", async () => {
  offline();
  const created = await call("/v1/sources", {
    method: "POST",
    cookie: account.cookie,
    json: { name: "agenda", config: { kind: "mcp", url: "https://calendarmcp.googleapis.com/mcp/v1", headers: {} } },
  });
  expect((await body<SourceView>(created)).data.icon).toBe("googlecalendar");
  const listed = items(
    (await body<CatalogView>(await call("/v1/catalog?query=agenda", { cookie: account.cookie }))).data,
  );
  expect(listed.find((item) => item.id === "google_calendar")).toMatchObject({ installed: true, sourceName: "agenda" });
  const catalog = JSON.parse(CATALOG_BY_URL_HASH) as Record<string, { icon: string }>;
  expect(catalog[hashUrl("https://docsmcp.googleapis.com/mcp/v1")]?.icon).toBe("googledocs");
  expect(catalog[hashUrl("https://sheetsmcp.googleapis.com/mcp/v1")]?.icon).toBe("googlesheets");
});

test("a source whose catalog entry was removed stays listed as a custom remote MCP", async () => {
  offline();
  const url = "https://mcp.asana.com/v2/mcp";
  expect(
    items((await body<CatalogView>(await call("/v1/catalog", { cookie: account.cookie }))).data).some(
      (item) => item.url === url,
    ),
  ).toBe(false);
  const created = await call("/v1/sources", {
    method: "POST",
    cookie: account.cookie,
    json: { name: "asana", config: { kind: "mcp", url, headers: {} } },
  });
  expect(created.status).toBe(201);
  const listed = await body<SourceView[]>(await call("/v1/sources", { cookie: account.cookie }));
  expect(listed.data.find((source) => source.name === "asana")).toMatchObject({
    config: { kind: "mcp", url },
    icon: null,
    auth: null,
    tokenUrl: null,
  });
  const detail = await body<SourceView>(await call("/v1/sources/asana", { cookie: account.cookie }));
  expect(detail.data).toMatchObject({ name: "asana", config: { kind: "mcp", url }, icon: null, auth: null });
});
