import { cancelledPage, confirmPage, preferredLocale } from "./page";
import { type BrokerEnv, type BrokerProvider, PROVIDERS, type RateLimiter } from "./providers";
import { type BrokerState, isLoopback, parseState } from "./state";

export type BrokerFetch = (input: string, init: RequestInit) => Promise<Response>;

export const MAX_BODY_BYTES = 8 * 1024;

const FORM_TYPE = "application/x-www-form-urlencoded";

const ROUTE_METHODS: Record<string, string[]> = { callback: ["GET", "POST"], token: ["POST"] };

const RELAY_ROUTE = "mcp";

const NO_STORE = { "cache-control": "no-store" };

const text = (status: number, body: string, headers: Record<string, string> = {}) =>
  new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8", ...NO_STORE, ...headers } });

const jsonError = (status: number, error: string, description: string, headers: Record<string, string> = {}) =>
  Response.json({ error, error_description: description }, { status, headers: { ...NO_STORE, ...headers } });

const notAllowed = (allow: string[]) => text(405, "Method not allowed.", { allow: allow.join(", ") });

const html = (body: string, formTarget?: URL) =>
  new Response(body, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-security-policy": `default-src 'none'; style-src 'unsafe-inline'; form-action 'self'${formTarget ? ` ${formTarget.origin}` : ""}; frame-ancestors 'none'; base-uri 'none'`,
      "x-frame-options": "DENY",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
      ...NO_STORE,
    },
  });

class BodyTooLarge extends Error {}

const isForm = (request: Request) =>
  (request.headers.get("content-type") ?? "").split(";")[0]?.trim().toLowerCase() === FORM_TYPE;

const readForm = async (request: Request) => {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) throw new BodyTooLarge();
  if (!request.body) return new URLSearchParams();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
    size += chunk.value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new BodyTooLarge();
    }
    chunks.push(chunk.value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new URLSearchParams(new TextDecoder().decode(bytes));
};

const isLimited = async (limiter: RateLimiter | undefined, request: Request, kind: string) => {
  if (!limiter) return false;
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  try {
    const { success } = await limiter.limit({ key: `${kind}:${ip}` });
    return !success;
  } catch {
    return false;
  }
};

const resultFields = (params: URLSearchParams): [string, string][] => {
  const code = params.get("code");
  if (code) return [["code", code]];
  const fields: [string, string][] = [["error", params.get("error") || "access_denied"]];
  const description = params.get("error_description");
  if (description) fields.push(["error_description", description]);
  return fields;
};

const redirectToInstance = (state: BrokerState, params: URLSearchParams) => {
  const target = new URL(state.returnUrl);
  for (const [name, value] of resultFields(params)) target.searchParams.set(name, value);
  target.searchParams.set("state", state.state);
  return new Response(null, {
    status: 302,
    headers: { location: target.toString(), "referrer-policy": "no-referrer", ...NO_STORE },
  });
};

const invalidState = () => text(400, "Invalid OAuth state.");

const callbackGet = (request: Request, url: URL) => {
  const rawState = url.searchParams.get("state");
  const state = parseState(rawState);
  if (!state || !rawState) return invalidState();
  if (isLoopback(state.returnUrl)) return redirectToInstance(state, url.searchParams);
  const locale = preferredLocale(request.headers.get("accept-language"));
  const fields = [...resultFields(url.searchParams), ["state", rawState] as [string, string]];
  return html(confirmPage(locale, url.pathname, state.returnUrl, fields), state.returnUrl);
};

const callbackPost = async (request: Request) => {
  if (!isForm(request)) return text(415, "Unsupported content type.");
  const form = await readForm(request);
  if (form.get("decision") === "cancel") {
    return html(cancelledPage(preferredLocale(request.headers.get("accept-language"))));
  }
  const state = parseState(form.get("state"));
  if (!state) return invalidState();
  return redirectToInstance(state, form);
};

const tokenParams = (form: URLSearchParams, provider: BrokerProvider) => {
  const grantType = form.get("grant_type") ?? "";
  if (grantType === "authorization_code") {
    const code = form.get("code");
    const verifier = form.get("code_verifier");
    if (!code || !verifier) return { error: "code and code_verifier are required." };
    return { params: new URLSearchParams({ grant_type: grantType, code, code_verifier: verifier }), redirect: true };
  }
  if (grantType === "refresh_token") {
    const refreshToken = form.get("refresh_token");
    if (!refreshToken) return { error: "refresh_token is required." };
    const params = new URLSearchParams({ grant_type: grantType, refresh_token: refreshToken });
    for (const name of provider.refreshParams) {
      const value = form.get(name);
      if (value) params.set(name, value);
    }
    return { params, redirect: false };
  }
  return null;
};

const token = async (
  request: Request,
  callbackUrl: string,
  provider: BrokerProvider,
  env: BrokerEnv,
  fetchFn: BrokerFetch,
) => {
  if (!isForm(request)) return jsonError(415, "invalid_request", `Content type must be ${FORM_TYPE}.`);
  const parsed = tokenParams(await readForm(request), provider);
  if (!parsed) {
    return jsonError(400, "unsupported_grant_type", "Only authorization_code and refresh_token are supported.");
  }
  if ("error" in parsed) return jsonError(400, "invalid_request", parsed.error ?? "Invalid request.");
  const clientId = env[provider.clientIdKey];
  const clientSecret = env[provider.clientSecretKey];
  if (!clientId || !clientSecret) return jsonError(500, "server_error", "Provider is not configured.");
  const { params, redirect } = parsed;
  params.set("client_id", clientId);
  params.set("client_secret", clientSecret);
  if (redirect) params.set("redirect_uri", callbackUrl);
  try {
    const upstream = await fetchFn(provider.tokenUrl, {
      method: "POST",
      headers: { "content-type": FORM_TYPE, accept: "application/json" },
      body: params.toString(),
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json", ...NO_STORE },
    });
  } catch {
    return jsonError(502, "temporarily_unavailable", "Provider token endpoint is unreachable.");
  }
};

const HOMEPAGE = "https://runelay.com/";

const CLIENT_METADATA_PATH = `/${RELAY_ROUTE}/client.json`;

const clientMetadata = (origin: string) =>
  Response.json(
    {
      client_id: `${origin}${CLIENT_METADATA_PATH}`,
      client_name: "runelay",
      client_uri: "https://runelay.com",
      logo_uri: "https://runelay.com/apple-touch-icon.png",
      redirect_uris: [`${origin}/${RELAY_ROUTE}/callback`],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    },
    {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=3600",
        "x-content-type-options": "nosniff",
      },
    },
  );

const route = async (request: Request, url: URL, env: BrokerEnv, fetchFn: BrokerFetch) => {
  if (url.pathname === "/" && request.method === "GET") return Response.redirect(HOMEPAGE, 301);
  if (url.pathname === "/health") return request.method === "GET" ? Response.json({ ok: true }) : notAllowed(["GET"]);
  if (url.pathname === CLIENT_METADATA_PATH) {
    return request.method === "GET" ? clientMetadata(url.origin) : notAllowed(["GET"]);
  }
  const [, name = "", action = "", ...rest] = url.pathname.split("/");
  const provider = PROVIDERS.get(name);
  const relay = name === RELAY_ROUTE && action === "callback";
  const methods = Object.hasOwn(ROUTE_METHODS, action) ? ROUTE_METHODS[action] : undefined;
  if ((!provider && !relay) || !methods || rest.length > 0) return text(404, "Not found.");
  if (!methods.includes(request.method)) return notAllowed(methods);
  if (action === "token" && provider) {
    if (await isLimited(env.TOKEN_RATE_LIMITER, request, "token")) {
      return jsonError(429, "slow_down", "Too many requests.", { "retry-after": "60" });
    }
    return token(request, `${url.origin}/${name}/callback`, provider, env, fetchFn);
  }
  if (await isLimited(env.CALLBACK_RATE_LIMITER, request, "callback")) {
    return text(429, "Too many requests.", { "retry-after": "60" });
  }
  return request.method === "GET" ? callbackGet(request, url) : callbackPost(request);
};

export const handleRequest = async (request: Request, env: BrokerEnv, fetchFn: BrokerFetch = fetch) => {
  try {
    return await route(request, new URL(request.url), env, fetchFn);
  } catch (error) {
    if (!(error instanceof BodyTooLarge)) throw error;
    return new URL(request.url).pathname.endsWith("/token")
      ? jsonError(413, "invalid_request", "Request body is too large.")
      : text(413, "Request body is too large.");
  }
};
