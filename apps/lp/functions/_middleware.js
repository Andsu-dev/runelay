const CANONICAL_HOST = "runelay.com";
const LEGACY_HOSTS = new Set(["bot.runelay.com", "www.runelay.com"]);
const LANG_COOKIE = "runelay-lang";
const CRAWLER = /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|lighthouse|headless|curl|wget/i;

const prefersPortuguese = (header) => {
  const [top] = (header ?? "")
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().toLowerCase().split(";");
      const q = Number(params.find((param) => param.trim().startsWith("q="))?.trim().slice(2) ?? 1);
      return { tag, q: Number.isNaN(q) ? 0 : q, index };
    })
    .filter(({ tag, q }) => tag && tag !== "*" && q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  return top?.tag.startsWith("pt") ?? false;
};

const chosenLanguage = (cookie) => cookie?.match(new RegExp(`(?:^|;\\s*)${LANG_COOKIE}=([^;]+)`))?.[1];

const cameFromSite = (referer) => {
  try {
    return new URL(referer).hostname === CANONICAL_HOST;
  } catch {
    return false;
  }
};

const varyOnLanguage = (response) => {
  const varied = new Response(response.body, response);
  varied.headers.append("Vary", "Accept-Language, Cookie");
  return varied;
};

export const onRequest = async ({ request, next }) => {
  const url = new URL(request.url);
  if (LEGACY_HOSTS.has(url.hostname)) {
    url.hostname = CANONICAL_HOST;
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  }
  if (url.pathname !== "/" || request.method !== "GET") return next();
  const { headers } = request;
  const skip =
    chosenLanguage(headers.get("Cookie")) ||
    CRAWLER.test(headers.get("User-Agent") ?? "") ||
    cameFromSite(headers.get("Referer")) ||
    !prefersPortuguese(headers.get("Accept-Language"));
  if (skip) return varyOnLanguage(await next());
  return new Response(null, {
    status: 302,
    headers: { Location: `/pt-br/${url.search}`, Vary: "Accept-Language, Cookie", "Cache-Control": "private, no-store" },
  });
};
