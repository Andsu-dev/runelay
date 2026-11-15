import { afterEach, beforeAll, expect, spyOn, test } from "bun:test";
import type { CatalogView, SourceView } from "@runelay/shared";
import { CATALOG, CATALOG_BY_URL_HASH } from "@/modules/catalog/constants/catalog.constants";
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
    json: { id: "github", token: "ghp_test" },
  });
  const { data } = await body<SourceView>(response);
  expect(response.status).toBe(201);
  expect(data.config).toMatchObject({ kind: "mcp", headers: { Authorization: "Bearer ghp_test" } });
  expect(data).toMatchObject({ auth: "api_key", tokenUrl: "https://github.com/settings/personal-access-tokens/new" });
});

test("installs a brokered connector and remembers its broker", async () => {
  offline();
  const response = await call("/v1/catalog/install", {
    method: "POST",
    cookie: account.cookie,
    json: { id: "google_calendar" },
  });
  expect(response.status).toBe(201);
  const { data } = await body<SourceView>(response);
  expect(data).toMatchObject({ name: "google_calendar", icon: "googlecalendar", auth: "oauth" });
  const item = CATALOG.flatMap((section) => section.items).find((candidate) => candidate.id === "google_calendar");
  expect(findSource({ organizationId: account.organizationId, name: "google_calendar" }).data?.oauth.broker).toEqual(
    item?.broker,
  );
  expect(findSource({ organizationId: account.organizationId, name: "linear" }).data?.oauth.broker).toBeUndefined();
});
