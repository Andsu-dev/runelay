import { afterEach, beforeAll, expect, spyOn, test } from "bun:test";
import type { CatalogView, SourceView } from "@runelay/shared";
import { CATALOG, CATALOG_ICON_BY_URL_HASH } from "@/modules/catalog/constants/catalog.constants";
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

test("icon map is keyed by normalized url hash", () => {
  const icons = JSON.parse(CATALOG_ICON_BY_URL_HASH) as Record<string, string>;
  expect(icons[hashUrl("HTTPS://mcp.linear.app/mcp/ ")]).toBe("linear");
});
