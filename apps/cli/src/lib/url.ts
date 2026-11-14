export const normalizeMcpUrl = (raw: string) => {
  const url = URL.parse(raw.trim());
  if (!url) return raw.trim().toLowerCase();
  const port = url.port && !["80", "443"].includes(url.port) ? `:${url.port}` : "";
  const path = url.pathname.replace(/\/+$/, "");
  return `${url.protocol}//${url.hostname.toLowerCase()}${port}${path}${url.search}`;
};
