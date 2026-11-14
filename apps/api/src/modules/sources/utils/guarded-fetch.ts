import { env } from "@/config/env";
import { MAX_REDIRECTS } from "@/modules/sources/constants/network.constants";
import { resolvesToPrivateAddress } from "@/modules/sources/utils/private-address";

const assertPublic = async (url: URL) => {
  if (url.protocol !== "https:" && url.protocol !== "http:")
    throw new Error(`Protocolo não permitido: ${url.protocol}`);
  if (!env.RUNELAY_ALLOW_PRIVATE_URLS && (await resolvesToPrivateAddress(url.hostname))) {
    throw new Error(`${url.hostname} aponta para a rede interna. Libere com RUNELAY_ALLOW_PRIVATE_URLS=true.`);
  }
};

export const guardedFetch = async (input: string | URL, init?: RequestInit): Promise<Response> => {
  let url = new URL(input);
  let request = init;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    await assertPublic(url);
    const response = await fetch(url, { ...request, redirect: "manual" });
    const location = response.headers.get("location");
    if (response.status < 300 || response.status >= 400 || !location) return response;
    url = new URL(location, url);
    if (
      response.status === 303 ||
      ((response.status === 301 || response.status === 302) && request?.method === "POST")
    ) {
      request = { ...request, method: "GET", body: undefined };
    }
  }
  throw new Error(`Redirecionamentos demais a partir de ${String(input)}`);
};
