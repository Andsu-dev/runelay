const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export interface BrokerState {
  returnUrl: URL;
  state: string;
}

const decodeBase64Url = (value: string) =>
  new TextDecoder().decode(
    Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), (char) => char.charCodeAt(0)),
  );

const isAllowedReturnUrl = (url: URL) =>
  url.protocol === "https:" || (url.protocol === "http:" && LOOPBACK_HOSTS.has(url.hostname));

export const parseState = (raw: string | null): BrokerState | null => {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(decodeBase64Url(raw));
    if (!parsed || typeof parsed !== "object") return null;
    const { r, s } = parsed as Record<string, unknown>;
    if (typeof r !== "string" || typeof s !== "string") return null;
    const returnUrl = new URL(r);
    return isAllowedReturnUrl(returnUrl) ? { returnUrl, state: s } : null;
  } catch {
    return null;
  }
};
