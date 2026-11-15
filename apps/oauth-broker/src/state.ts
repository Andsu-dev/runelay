const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const RETURN_PATH = "/v1/oauth/callback";

export const MAX_STATE_LENGTH = 2048;

export interface BrokerState {
  returnUrl: URL;
  state: string;
}

const decodeBase64Url = (value: string) =>
  new TextDecoder().decode(
    Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), (char) => char.charCodeAt(0)),
  );

export const isLoopback = (url: URL) => LOOPBACK_HOSTS.has(url.hostname);

const isAllowedReturnUrl = (raw: string, url: URL) =>
  (url.protocol === "https:" || (url.protocol === "http:" && isLoopback(url))) &&
  url.hostname !== "" &&
  url.pathname === RETURN_PATH &&
  url.username === "" &&
  url.password === "" &&
  !raw.includes("?") &&
  !raw.includes("#");

export const parseState = (raw: string | null): BrokerState | null => {
  if (!raw || raw.length > MAX_STATE_LENGTH) return null;
  try {
    const parsed: unknown = JSON.parse(decodeBase64Url(raw));
    if (!parsed || typeof parsed !== "object") return null;
    const { r, s } = parsed as Record<string, unknown>;
    if (typeof r !== "string" || typeof s !== "string") return null;
    const returnUrl = new URL(r);
    return isAllowedReturnUrl(r, returnUrl) ? { returnUrl, state: s } : null;
  } catch {
    return null;
  }
};
