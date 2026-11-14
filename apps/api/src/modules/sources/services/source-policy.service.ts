import { fail, ok, type Result, type SourceConfig } from "@runelay/shared";
import { env } from "@/config/env";
import type { SourceActor } from "@/modules/sources/types/source-policy.types";
import { resolvesToPrivateAddress } from "@/modules/sources/utils/private-address";

const urlsOf = (config: SourceConfig) => {
  if (config.kind === "mcp") return [config.url];
  if (config.kind === "openapi")
    return [config.spec, config.baseUrl].filter((url): url is string => Boolean(url && /^https?:\/\//.test(url)));
  return [];
};

export const checkSourcePolicy = async (config: SourceConfig, actor: SourceActor): Promise<Result<null>> => {
  if (config.kind === "stdio") {
    if (!env.RUNELAY_ENABLE_STDIO) {
      return fail("FORBIDDEN", "Conexões por comando local estão desligadas neste servidor (RUNELAY_ENABLE_STDIO).");
    }
    if (actor.authMethod !== "session" || (actor.role !== "owner" && actor.role !== "admin")) {
      return fail("FORBIDDEN", "Só owner ou admin, logado no painel, cria conexão por comando local.");
    }
  }
  for (const raw of urlsOf(config)) {
    const url = URL.parse(raw);
    if (!url || (url.protocol !== "https:" && url.protocol !== "http:")) {
      return fail("INVALID_INPUT", `URL inválida: ${raw}`);
    }
    if (!env.RUNELAY_ALLOW_PRIVATE_URLS && (await resolvesToPrivateAddress(url.hostname))) {
      return fail(
        "FORBIDDEN",
        `${url.hostname} aponta para a rede interna. Libere com RUNELAY_ALLOW_PRIVATE_URLS=true.`,
      );
    }
  }
  return ok(null);
};
