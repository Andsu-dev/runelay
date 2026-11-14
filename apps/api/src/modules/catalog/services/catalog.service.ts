import { type CatalogView, fail, ok, type Result, type SourceView } from "@runelay/shared";
import { CATALOG } from "@/modules/catalog/constants/catalog.constants";
import { listInstalledByUrlHash } from "@/modules/sources/repositories/source.repository";
import { createSource } from "@/modules/sources/services/source.service";
import type { SourceActor } from "@/modules/sources/types/source-policy.types";
import { hashUrl } from "@/modules/sources/utils/url-hash";

const normalize = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export const listCatalog = (organizationId: string, query?: string): Result<CatalogView> => {
  const terms = normalize(query ?? "")
    .split(/\s+/)
    .filter(Boolean);
  const sections = CATALOG.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      const haystack = normalize(`${item.id} ${item.name} ${item.description}`);
      return terms.every((term) => haystack.includes(term));
    }),
  })).filter((section) => section.items.length > 0);
  const installed = listInstalledByUrlHash(
    organizationId,
    sections.flatMap((section) => section.items.map((item) => hashUrl(item.url))),
  );
  if (installed.error) return installed;
  const installedByHash = new Map(installed.data.map((row) => [row.urlHash, row]));
  return ok({
    sections: sections.map((section) => ({
      ...section,
      items: section.items.map((item) => {
        const source = installedByHash.get(hashUrl(item.url));
        return {
          ...item,
          tokenUrl: item.tokenUrl ?? null,
          installed: Boolean(source),
          sourceName: source?.name ?? null,
          status: source?.status ?? null,
        };
      }),
    })),
  });
};

export const installCatalogItem = async (
  organizationId: string,
  id: string,
  actor: SourceActor,
  token?: string,
): Promise<Result<SourceView>> => {
  const item = CATALOG.flatMap((section) => section.items).find((candidate) => candidate.id === id);
  if (!item) return fail("CATALOG_ITEM_NOT_FOUND");
  return createSource(
    organizationId,
    {
      name: item.id,
      config: { kind: "mcp", url: item.url, headers: token ? { Authorization: `Bearer ${token}` } : {} },
    },
    actor,
  );
};
