const CANONICAL_HOST = "runelay.com";
const LEGACY_HOSTS = new Set(["bot.runelay.com", "www.runelay.com"]);

export const onRequest = ({ request, next }) => {
  const url = new URL(request.url);
  if (!LEGACY_HOSTS.has(url.hostname)) return next();
  url.hostname = CANONICAL_HOST;
  url.protocol = "https:";
  return Response.redirect(url.toString(), 301);
};
