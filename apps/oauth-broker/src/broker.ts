import { type BrokerEnv, type BrokerProvider, PROVIDERS } from "./providers";
import { parseState } from "./state";

export type BrokerFetch = (input: string, init: RequestInit) => Promise<Response>;

const GRANT_TYPES = new Set(["authorization_code", "refresh_token"]);

const NO_STORE = { "cache-control": "no-store" };

const text = (status: number, body: string) =>
  new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8", ...NO_STORE } });

const jsonError = (status: number, error: string, description: string) =>
  Response.json({ error, error_description: description }, { status, headers: NO_STORE });

const callback = (url: URL) => {
  const state = parseState(url.searchParams.get("state"));
  if (!state) return text(400, "Invalid OAuth state.");
  const target = new URL(state.returnUrl);
  const code = url.searchParams.get("code");
  if (code) {
    target.searchParams.set("code", code);
  } else {
    target.searchParams.set("error", url.searchParams.get("error") ?? "access_denied");
    const description = url.searchParams.get("error_description");
    if (description) target.searchParams.set("error_description", description);
  }
  target.searchParams.set("state", state.state);
  return new Response(null, {
    status: 302,
    headers: { location: target.toString(), "referrer-policy": "no-referrer", ...NO_STORE },
  });
};

const token = async (
  request: Request,
  callbackUrl: string,
  provider: BrokerProvider,
  env: BrokerEnv,
  fetchFn: BrokerFetch,
) => {
  const clientId = env[provider.clientIdKey];
  const clientSecret = env[provider.clientSecretKey];
  if (!clientId || !clientSecret) return jsonError(500, "server_error", "Provider is not configured.");
  const form = new URLSearchParams(await request.text());
  const grantType = form.get("grant_type") ?? "";
  if (!GRANT_TYPES.has(grantType)) {
    return jsonError(400, "unsupported_grant_type", "Only authorization_code and refresh_token are supported.");
  }
  form.delete("resource");
  form.set("client_id", clientId);
  form.set("client_secret", clientSecret);
  if (grantType === "authorization_code") form.set("redirect_uri", callbackUrl);
  try {
    const upstream = await fetchFn(provider.tokenUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: form.toString(),
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json", ...NO_STORE },
    });
  } catch {
    return jsonError(502, "temporarily_unavailable", "Provider token endpoint is unreachable.");
  }
};

export const handleRequest = async (request: Request, env: BrokerEnv, fetchFn: BrokerFetch = fetch) => {
  const url = new URL(request.url);
  if (url.pathname === "/health" && request.method === "GET") return Response.json({ ok: true });
  const [, name = "", action, ...rest] = url.pathname.split("/");
  const provider = PROVIDERS.get(name);
  if (provider && rest.length === 0) {
    if (action === "callback" && request.method === "GET") return callback(url);
    if (action === "token" && request.method === "POST") {
      return token(request, `${url.origin}/${name}/callback`, provider, env, fetchFn);
    }
  }
  return text(404, "Not found.");
};
