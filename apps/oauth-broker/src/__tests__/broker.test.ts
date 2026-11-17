import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { type BrokerFetch, handleRequest, MAX_BODY_BYTES } from "../broker";
import worker from "../index";
import { escapeHtml, preferredLocale } from "../page";
import type { BrokerEnv, RateLimiter } from "../providers";
import { MAX_STATE_LENGTH, parseState } from "../state";

const ORIGIN = "https://auth.runelay.test";
const ENV: BrokerEnv = { GOOGLE_CLIENT_ID: "client-id", GOOGLE_CLIENT_SECRET: "client-secret" };
const REMOTE = "https://runelay.example.com/v1/oauth/callback";
const LOCAL = "http://localhost:4312/v1/oauth/callback";
const FORM = { "content-type": "application/x-www-form-urlencoded" };

const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");

const remoteState = encode({ r: REMOTE, s: "google_calendar" });
const localState = encode({ r: LOCAL, s: "google_calendar" });

const get = (path: string, env: BrokerEnv = ENV, headers: Record<string, string> = {}) =>
  handleRequest(new Request(`${ORIGIN}${path}`, { headers }), env);

const post = (
  path: string,
  body: RequestInit["body"],
  headers: Record<string, string> = FORM,
  env: BrokerEnv = ENV,
  fetchFn?: BrokerFetch,
) => handleRequest(new Request(`${ORIGIN}${path}`, { method: "POST", headers, body }), env, fetchFn);

const postCallback = (body: Record<string, string>, headers: Record<string, string> = FORM, env: BrokerEnv = ENV) =>
  post("/google/callback", new URLSearchParams(body), headers, env);

const postToken = (body: Record<string, string>, env: BrokerEnv = ENV, fetchFn?: BrokerFetch) =>
  post("/google/token", new URLSearchParams(body), FORM, env, fetchFn);

const location = (response: Response) => new URL(response.headers.get("location") ?? "");

const hiddenFields = (page: string) =>
  Object.fromEntries(
    [...page.matchAll(/<input type="hidden" name="([^"]*)" value="([^"]*)">/g)].map((match) => [match[1], match[2]]),
  );

const upstream = (
  status = 200,
  payload: unknown = { access_token: "at", token_type: "Bearer" },
  contentType = true,
) => {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchFn = mock<BrokerFetch>(async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(payload), {
      status,
      headers: contentType ? { "content-type": "application/json; charset=utf-8" } : {},
    });
  });
  const form = (index = 0) => new URLSearchParams(String(calls[index]?.init.body));
  return { calls, fetchFn, form };
};

const limiter = (allowed: number) => {
  const keys: string[] = [];
  const binding: RateLimiter = {
    limit: async ({ key }) => {
      keys.push(key);
      return { success: keys.filter((seen) => seen === key).length <= allowed };
    },
  };
  return { binding, keys };
};

afterEach(() => {
  mock.restore();
});

describe("root", () => {
  test("redirects GET to the runelay homepage", async () => {
    const response = await get("/");
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://runelay.com/");
  });

  test("answers 404 for other methods", async () => {
    const response = await handleRequest(new Request(`${ORIGIN}/`, { method: "POST" }), ENV);
    expect(response.status).toBe(404);
  });
});

describe("health", () => {
  test("answers ok", async () => {
    const response = await get("/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});

describe("callback for loopback instances", () => {
  test("redirects the code straight back with the original state", async () => {
    const response = await get(`/google/callback?code=abc&state=${localState}`);
    expect(response.status).toBe(302);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("cache-control")).toBe("no-store");
    const target = location(response);
    expect(target.origin + target.pathname).toBe(LOCAL);
    expect(target.searchParams.get("code")).toBe("abc");
    expect(target.searchParams.get("state")).toBe("google_calendar");
  });

  test("covers every loopback host", async () => {
    for (const host of ["localhost:4312", "127.0.0.1:4312", "[::1]:4312", "localhost"]) {
      const state = encode({ r: `http://${host}/v1/oauth/callback`, s: "x" });
      expect((await get(`/google/callback?code=c&state=${state}`)).status).toBe(302);
    }
  });

  test("forwards the provider error with its description", async () => {
    const response = await get(`/google/callback?error=access_denied&error_description=Denied&state=${localState}`);
    const target = location(response);
    expect(target.searchParams.get("error")).toBe("access_denied");
    expect(target.searchParams.get("error_description")).toBe("Denied");
    expect(target.searchParams.get("code")).toBeNull();
  });

  test("defaults the error when the provider sends neither code nor error", async () => {
    const target = location(await get(`/google/callback?state=${localState}`));
    expect(target.searchParams.get("error")).toBe("access_denied");
    expect(target.searchParams.has("error_description")).toBe(false);
  });
});

describe("callback interstitial for remote instances", () => {
  test("renders a confirmation page instead of redirecting", async () => {
    const response = await get(`/google/callback?code=abc&state=${remoteState}`);
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("content-type")).toBe("text/html; charset=utf-8");
    const page = await response.text();
    expect(page).toContain("<h1>This login is going to</h1>");
    expect(page).toContain('<code class="origin">https://runelay.example.com</code>');
    expect(page).toContain("Is this your runelay?");
    expect(page).toContain('<form method="POST" action="/google/callback">');
    expect(page).toContain('name="decision" value="continue"');
    expect(page).toContain('name="decision" value="cancel"');
    expect(hiddenFields(page)).toEqual({ code: "abc", state: remoteState });
  });

  test("sends the hardening headers with the target origin in form-action", async () => {
    const response = await get(`/google/callback?code=abc&state=${remoteState}`);
    expect(response.headers.get("content-security-policy")).toBe(
      "default-src 'none'; style-src 'unsafe-inline'; form-action 'self' https://runelay.example.com; frame-ancestors 'none'; base-uri 'none'",
    );
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  test("keeps the port in the displayed origin and form-action", async () => {
    const state = encode({ r: "https://runelay.example.com:8443/v1/oauth/callback", s: "x" });
    const response = await get(`/google/callback?code=abc&state=${state}`);
    expect(response.headers.get("content-security-policy")).toContain(
      "form-action 'self' https://runelay.example.com:8443;",
    );
    const page = await response.text();
    expect(page).toContain("https://runelay.example.com:8443</code>");
  });

  test("carries provider errors as hidden fields", async () => {
    const response = await get(`/google/callback?error=access_denied&error_description=No&state=${remoteState}`);
    expect(hiddenFields(await response.text())).toEqual({
      error: "access_denied",
      error_description: "No",
      state: remoteState,
    });
  });

  test("escapes everything it interpolates", async () => {
    const response = await get(
      `/google/callback?code=${encodeURIComponent('"><script>alert(1)</script>')}&state=${remoteState}`,
    );
    const page = await response.text();
    expect(page).not.toContain("<script>");
    expect(page).toContain('value="&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;"');
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  });

  test("shows the IDN host in punycode", async () => {
    const state = encode({ r: "https://rúnelay.example.com/v1/oauth/callback", s: "x" });
    const page = await (await get(`/google/callback?code=c&state=${state}`)).text();
    expect(page).toContain('<code class="origin">https://xn--rnelay-pya.example.com</code>');
    expect(page).not.toContain("rúnelay");
  });

  test("speaks Portuguese when the browser prefers it", async () => {
    const response = await get(`/google/callback?code=abc&state=${remoteState}`, ENV, {
      "accept-language": "pt-BR,pt;q=0.9,en;q=0.8",
    });
    const page = await response.text();
    expect(page).toContain('<html lang="pt-BR">');
    expect(page).toContain("<h1>Este login vai para</h1>");
    expect(page).toContain("Continuar");
  });

  test("picks the locale by quality", () => {
    expect(preferredLocale(null)).toBe("en");
    expect(preferredLocale("pt")).toBe("pt");
    expect(preferredLocale("pt-PT")).toBe("pt");
    expect(preferredLocale("en-US,pt-BR;q=0.5")).toBe("en");
    expect(preferredLocale("en;q=0.4,pt-BR;q=0.8")).toBe("pt");
    expect(preferredLocale("pt;q=0,en")).toBe("en");
    expect(preferredLocale("ptx,pt")).toBe("en");
    expect(preferredLocale("de;q=abc,pt;q=0.1")).toBe("pt");
  });

  test("ignores query flags that try to skip the page", async () => {
    for (const extra of ["confirm=1", "decision=continue", "skip=true"]) {
      const response = await get(`/google/callback?code=abc&${extra}&state=${remoteState}`);
      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    }
  });
});

describe("callback confirmation post", () => {
  test("continue redirects the code to the instance", async () => {
    const response = await postCallback({ code: "abc", state: remoteState, decision: "continue" });
    expect(response.status).toBe(302);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    const target = location(response);
    expect(target.origin + target.pathname).toBe(REMOTE);
    expect(target.searchParams.get("code")).toBe("abc");
    expect(target.searchParams.get("state")).toBe("google_calendar");
  });

  test("continue forwards provider errors", async () => {
    const target = location(
      await postCallback({ error: "access_denied", error_description: "No", state: remoteState }),
    );
    expect(target.searchParams.get("error")).toBe("access_denied");
    expect(target.searchParams.get("error_description")).toBe("No");
    expect(target.searchParams.get("code")).toBeNull();
  });

  test("cancel shows a closing page and sends nothing to the instance", async () => {
    const response = await postCallback({ code: "abc", state: remoteState, decision: "cancel" });
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("content-security-policy")).toBe(
      "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
    );
    const page = await response.text();
    expect(page).toContain("Login cancelled. You can close this tab.");
    expect(page).not.toContain("runelay.example.com");
    const portuguese = await postCallback({ decision: "cancel" }, { ...FORM, "accept-language": "pt-BR" });
    expect(await portuguese.text()).toContain("Login cancelado. Você pode fechar esta aba.");
  });

  test("re-validates the state", async () => {
    for (const body of [
      { code: "abc" },
      { code: "abc", state: "bad" },
      { code: "abc", state: encode({ r: "https://evil.example.com/steal", s: "x" }) },
    ] as Record<string, string>[]) {
      const response = await postCallback(body);
      expect(response.status).toBe(400);
      expect(await response.text()).toBe("Invalid OAuth state.");
    }
  });

  test("only accepts form bodies", async () => {
    const response = await post("/google/callback", JSON.stringify({ code: "abc", state: remoteState }), {
      "content-type": "application/json",
    });
    expect(response.status).toBe(415);
  });

  test("rejects bodies over the size limit", async () => {
    const response = await postCallback({ code: "a".repeat(MAX_BODY_BYTES), state: remoteState });
    expect(response.status).toBe(413);
    expect(await response.text()).toBe("Request body is too large.");
  });
});

describe("state validation", () => {
  const rejected = [
    "",
    "state=",
    "state=not-base64-json",
    `state=${encode(null)}`,
    `state=${encode("text")}`,
    `state=${encode({ r: REMOTE })}`,
    `state=${encode({ r: 1, s: "x" })}`,
    `state=${encode({ r: "not a url", s: "x" })}`,
    `state=${encode({ r: "javascript:alert(1)", s: "x" })}`,
    `state=${encode({ r: "http://runelay.example.com/v1/oauth/callback", s: "x" })}`,
    `state=${encode({ r: "ftp://runelay.example.com/v1/oauth/callback", s: "x" })}`,
    `state=${encode({ r: "https://runelay.example.com", s: "x" })}`,
    `state=${encode({ r: "https://runelay.example.com/v1/oauth/callback/", s: "x" })}`,
    `state=${encode({ r: "https://runelay.example.com/other/v1/oauth/callback", s: "x" })}`,
    `state=${encode({ r: "https://user:pass@runelay.example.com/v1/oauth/callback", s: "x" })}`,
    `state=${encode({ r: "https://user@runelay.example.com/v1/oauth/callback", s: "x" })}`,
    `state=${encode({ r: "https://runelay.example.com/v1/oauth/callback?next=x", s: "x" })}`,
    `state=${encode({ r: "https://runelay.example.com/v1/oauth/callback?", s: "x" })}`,
    `state=${encode({ r: "https://runelay.example.com/v1/oauth/callback#x", s: "x" })}`,
    `state=${encode({ r: "https://runelay.example.com/v1/oauth/callback#", s: "x" })}`,
  ];

  test("rejects malformed states and disallowed return urls", async () => {
    for (const bad of rejected) {
      const response = await get(`/google/callback?code=c&${bad}`);
      expect(response.status).toBe(400);
      expect(await response.text()).toBe("Invalid OAuth state.");
    }
  });

  test("rejects states over the length limit", () => {
    const padded = encode({ r: REMOTE, s: "x".repeat(MAX_STATE_LENGTH) });
    expect(padded.length).toBeGreaterThan(MAX_STATE_LENGTH);
    expect(parseState(padded)).toBeNull();
    const fits = encode({ r: REMOTE, s: "x".repeat(1000) });
    expect(fits.length).toBeLessThanOrEqual(MAX_STATE_LENGTH);
    expect(parseState(fits)?.state).toBe("x".repeat(1000));
  });

  test("decodes non ascii state values", () => {
    expect(parseState(encode({ r: REMOTE, s: "agenda-ção" }))?.state).toBe("agenda-ção");
  });
});

describe("token", () => {
  test("exchanges a code forwarding only allowlisted params", async () => {
    const fake = upstream();
    const response = await postToken(
      {
        grant_type: "authorization_code",
        code: "abc",
        code_verifier: "verifier",
        client_id: "spoofed",
        client_secret: "spoofed",
        redirect_uri: "https://evil.example.com/cb",
        resource: "https://calendarmcp.googleapis.com/mcp/v1",
        scope: "https://www.googleapis.com/auth/drive",
        access_type: "offline",
        refresh_token: "smuggled",
      },
      ENV,
      fake.fetchFn,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(await response.json()).toEqual({ access_token: "at", token_type: "Bearer" });
    expect(fake.calls[0]?.url).toBe("https://oauth2.googleapis.com/token");
    expect(Object.fromEntries(fake.form())).toEqual({
      grant_type: "authorization_code",
      code: "abc",
      code_verifier: "verifier",
      client_id: "client-id",
      client_secret: "client-secret",
      redirect_uri: `${ORIGIN}/google/callback`,
    });
  });

  test("refreshes with scope, without a redirect uri, and passes errors through", async () => {
    const fake = upstream(400, { error: "invalid_grant" }, false);
    const response = await postToken(
      {
        grant_type: "refresh_token",
        refresh_token: "rt",
        scope: "a b",
        client_id: "spoofed",
        resource: "https://calendarmcp.googleapis.com/mcp/v1",
        code: "abc",
        redirect_uri: "https://evil.example.com/cb",
      },
      ENV,
      fake.fetchFn,
    );
    expect(response.status).toBe(400);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(await response.json()).toEqual({ error: "invalid_grant" });
    expect(Object.fromEntries(fake.form())).toEqual({
      grant_type: "refresh_token",
      refresh_token: "rt",
      scope: "a b",
      client_id: "client-id",
      client_secret: "client-secret",
    });
  });

  test("requires PKCE for codes and a refresh token for refreshes", async () => {
    const fake = upstream();
    for (const body of [
      { grant_type: "authorization_code", code: "abc" },
      { grant_type: "authorization_code", code_verifier: "verifier" },
      { grant_type: "authorization_code", code: "abc", code_verifier: "" },
      { grant_type: "refresh_token" },
    ] as Record<string, string>[]) {
      const response = await postToken(body, ENV, fake.fetchFn);
      expect(response.status).toBe(400);
      expect(((await response.json()) as { error: string }).error).toBe("invalid_request");
    }
    expect(fake.calls).toHaveLength(0);
  });

  test("rejects other grant types without calling the provider", async () => {
    const fake = upstream();
    for (const body of [{ grant_type: "client_credentials" }, {}] as Record<string, string>[]) {
      const response = await postToken(body, ENV, fake.fetchFn);
      expect(response.status).toBe(400);
      expect(((await response.json()) as { error: string }).error).toBe("unsupported_grant_type");
    }
    expect(fake.calls).toHaveLength(0);
  });

  test("only accepts form bodies", async () => {
    const fake = upstream();
    for (const headers of [{ "content-type": "application/json" }, {}, { "content-type": "text/plain" }] as Record<
      string,
      string
    >[]) {
      const response = await post(
        "/google/token",
        "grant_type=refresh_token&refresh_token=rt",
        headers,
        ENV,
        fake.fetchFn,
      );
      expect(response.status).toBe(415);
      expect(((await response.json()) as { error: string }).error).toBe("invalid_request");
    }
    const charset = await post(
      "/google/token",
      "grant_type=refresh_token&refresh_token=rt",
      { "content-type": "Application/X-WWW-Form-Urlencoded; charset=UTF-8" },
      ENV,
      fake.fetchFn,
    );
    expect(charset.status).toBe(200);
    expect(fake.calls).toHaveLength(1);
  });

  test("rejects bodies over the size limit by header or by stream", async () => {
    const fake = upstream();
    const declared = await post(
      "/google/token",
      "grant_type=refresh_token",
      { ...FORM, "content-length": "9000" },
      ENV,
      fake.fetchFn,
    );
    expect(declared.status).toBe(413);
    const streamed = await post(
      "/google/token",
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("grant_type=refresh_token&refresh_token="));
          controller.enqueue(new TextEncoder().encode("r".repeat(MAX_BODY_BYTES)));
          controller.close();
        },
      }),
      FORM,
      ENV,
      fake.fetchFn,
    );
    expect(streamed.status).toBe(413);
    expect(((await streamed.json()) as { error: string }).error).toBe("invalid_request");
    const fits = await postToken(
      { grant_type: "refresh_token", refresh_token: "r".repeat(MAX_BODY_BYTES - 100) },
      ENV,
      fake.fetchFn,
    );
    expect(fits.status).toBe(200);
    expect(fake.calls).toHaveLength(1);
  });

  test("fails closed when the provider secrets are missing", async () => {
    for (const env of [{}, { GOOGLE_CLIENT_ID: "id" }]) {
      const response = await postToken({ grant_type: "refresh_token", refresh_token: "rt" }, env);
      expect(response.status).toBe(500);
      expect(((await response.json()) as { error: string }).error).toBe("server_error");
    }
  });

  test("reports an unreachable provider", async () => {
    const response = await postToken({ grant_type: "refresh_token", refresh_token: "rt" }, ENV, async () => {
      throw new Error("down");
    });
    expect(response.status).toBe(502);
    expect(((await response.json()) as { error: string }).error).toBe("temporarily_unavailable");
  });
});

describe("github", () => {
  const GITHUB_ENV: BrokerEnv = { ...ENV, GITHUB_CLIENT_ID: "gh-client-id", GITHUB_CLIENT_SECRET: "gh-client-secret" };
  const githubLocal = encode({ r: LOCAL, s: "github" });
  const githubRemote = encode({ r: REMOTE, s: "github" });
  const githubToken = (body: Record<string, string>, env: BrokerEnv = GITHUB_ENV, fetchFn?: BrokerFetch) =>
    post("/github/token", new URLSearchParams(body), FORM, env, fetchFn);

  test("redirects loopback callbacks straight back", async () => {
    const response = await get(`/github/callback?code=gh-code&state=${githubLocal}`, GITHUB_ENV);
    expect(response.status).toBe(302);
    const target = location(response);
    expect(target.origin + target.pathname).toBe(LOCAL);
    expect(target.searchParams.get("code")).toBe("gh-code");
    expect(target.searchParams.get("state")).toBe("github");
  });

  test("asks remote instances for confirmation and posts back to the github callback", async () => {
    const response = await get(`/github/callback?code=gh-code&state=${githubRemote}`, GITHUB_ENV);
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    const page = await response.text();
    expect(page).toContain('<form method="POST" action="/github/callback">');
    expect(hiddenFields(page)).toEqual({ code: "gh-code", state: githubRemote });
    const confirmed = await post(
      "/github/callback",
      new URLSearchParams({ code: "gh-code", state: githubRemote, decision: "continue" }),
      FORM,
      GITHUB_ENV,
    );
    expect(confirmed.status).toBe(302);
    const target = location(confirmed);
    expect(target.origin + target.pathname).toBe(REMOTE);
    expect(target.searchParams.get("code")).toBe("gh-code");
    expect(target.searchParams.get("state")).toBe("github");
  });

  test("rejects an invalid state", async () => {
    const response = await get("/github/callback?code=gh-code&state=nope", GITHUB_ENV);
    expect(response.status).toBe(400);
  });

  test("exchanges a code with the github secrets and asks for json", async () => {
    const fake = upstream(200, { access_token: "gho_x", refresh_token: "ghr_x", token_type: "bearer" });
    const response = await githubToken(
      {
        grant_type: "authorization_code",
        code: "gh-code",
        code_verifier: "verifier",
        client_id: "spoofed",
        redirect_uri: "https://evil.example.com/cb",
        scope: "repo",
      },
      GITHUB_ENV,
      fake.fetchFn,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ access_token: "gho_x", refresh_token: "ghr_x", token_type: "bearer" });
    expect(fake.calls[0]?.url).toBe("https://github.com/login/oauth/access_token");
    expect(new Headers(fake.calls[0]?.init.headers).get("accept")).toBe("application/json");
    expect(Object.fromEntries(fake.form())).toEqual({
      grant_type: "authorization_code",
      code: "gh-code",
      code_verifier: "verifier",
      client_id: "gh-client-id",
      client_secret: "gh-client-secret",
      redirect_uri: `${ORIGIN}/github/callback`,
    });
  });

  test("refreshes without scope or redirect uri", async () => {
    const fake = upstream(200, { access_token: "gho_y", refresh_token: "ghr_y" });
    const response = await githubToken(
      {
        grant_type: "refresh_token",
        refresh_token: "ghr_x",
        scope: "repo",
        redirect_uri: "https://evil.example.com/cb",
      },
      GITHUB_ENV,
      fake.fetchFn,
    );
    expect(response.status).toBe(200);
    expect(Object.fromEntries(fake.form())).toEqual({
      grant_type: "refresh_token",
      refresh_token: "ghr_x",
      client_id: "gh-client-id",
      client_secret: "gh-client-secret",
    });
  });

  test("passes errors github sends with status 200 through untouched", async () => {
    const payload = {
      error: "bad_refresh_token",
      error_description: "The refresh token passed is incorrect or expired.",
    };
    const fake = upstream(200, payload);
    const response = await githubToken(
      { grant_type: "refresh_token", refresh_token: "ghr_x" },
      GITHUB_ENV,
      fake.fetchFn,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(payload);
  });

  test("fails closed when the github secrets are missing", async () => {
    for (const env of [ENV, { ...ENV, GITHUB_CLIENT_ID: "gh-client-id" }]) {
      const fake = upstream();
      const response = await githubToken({ grant_type: "refresh_token", refresh_token: "rt" }, env, fake.fetchFn);
      expect(response.status).toBe(500);
      expect(((await response.json()) as { error: string }).error).toBe("server_error");
      expect(fake.calls).toHaveLength(0);
    }
  });
});

describe("rate limiting", () => {
  test("limits callbacks per ip", async () => {
    const fake = limiter(2);
    const env = { ...ENV, CALLBACK_RATE_LIMITER: fake.binding };
    const headers = { "cf-connecting-ip": "203.0.113.7" };
    for (let attempt = 0; attempt < 2; attempt++) {
      expect((await get(`/google/callback?code=c&state=${localState}`, env, headers)).status).toBe(302);
    }
    const limited = await get(`/google/callback?code=c&state=${localState}`, env, headers);
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBe("60");
    expect(await limited.text()).toBe("Too many requests.");
    const posted = await postCallback({ code: "c", state: remoteState }, { ...FORM, ...headers }, env);
    expect(posted.status).toBe(429);
    expect(
      (await get(`/google/callback?code=c&state=${localState}`, env, { "cf-connecting-ip": "198.51.100.1" })).status,
    ).toBe(302);
    expect(fake.keys).toContain("callback:203.0.113.7");
    expect(fake.keys).toContain("callback:198.51.100.1");
  });

  test("limits token requests per ip with an OAuth error", async () => {
    const fake = limiter(1);
    const upstreamFake = upstream();
    const env = { ...ENV, TOKEN_RATE_LIMITER: fake.binding };
    const request = () =>
      handleRequest(
        new Request(`${ORIGIN}/google/token`, {
          method: "POST",
          headers: { ...FORM, "cf-connecting-ip": "203.0.113.7" },
          body: "grant_type=refresh_token&refresh_token=rt",
        }),
        env,
        upstreamFake.fetchFn,
      );
    expect((await request()).status).toBe(200);
    const limited = await request();
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBe("60");
    expect(((await limited.json()) as { error: string }).error).toBe("slow_down");
    expect(upstreamFake.calls).toHaveLength(1);
    expect(fake.keys).toEqual(["token:203.0.113.7", "token:203.0.113.7"]);
  });

  test("falls back to a shared key without an ip and fails open when the binding throws", async () => {
    const fake = limiter(5);
    await get(`/google/callback?code=c&state=${localState}`, { ...ENV, CALLBACK_RATE_LIMITER: fake.binding });
    expect(fake.keys).toEqual(["callback:unknown"]);
    const broken: RateLimiter = {
      limit: async () => {
        throw new Error("unavailable");
      },
    };
    const response = await get(`/google/callback?code=c&state=${localState}`, {
      ...ENV,
      CALLBACK_RATE_LIMITER: broken,
    });
    expect(response.status).toBe(302);
  });
});

describe("routing", () => {
  test("answers 404 for unknown providers, actions and paths", async () => {
    const paths = [
      "/gitlab/callback",
      "/constructor/callback",
      "/google/other",
      "/google/constructor",
      "/google/callback/extra",
      "/google/token/extra",
    ];
    for (const path of paths) expect((await get(path)).status).toBe(404);
  });

  test("answers 405 with Allow for wrong methods on known routes", async () => {
    const cases: [string, string, string][] = [
      ["GET", "/google/token", "POST"],
      ["PUT", "/google/token", "POST"],
      ["DELETE", "/google/callback", "GET, POST"],
      ["POST", "/health", "GET"],
    ];
    for (const [method, path, allow] of cases) {
      const response = await handleRequest(new Request(`${ORIGIN}${path}`, { method }), ENV);
      expect(response.status).toBe(405);
      expect(response.headers.get("allow")).toBe(allow);
    }
  });

  test("the worker entry uses the global fetch", async () => {
    const spy = spyOn(globalThis, "fetch").mockImplementation(
      Object.assign(async () => Response.json({ access_token: "at" }), { preconnect: globalThis.fetch.preconnect }),
    );
    const response = await worker.fetch(
      new Request(`${ORIGIN}/google/token`, {
        method: "POST",
        body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: "rt" }),
      }),
      ENV,
    );
    expect(response.status).toBe(200);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe("mcp relay callback", () => {
  test("redirects a loopback instance straight back with the code and original state", async () => {
    const response = await get(`/mcp/callback?code=abc&state=${localState}`, {});
    expect(response.status).toBe(302);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const target = location(response);
    expect(target.origin + target.pathname).toBe(LOCAL);
    expect(target.searchParams.get("code")).toBe("abc");
    expect(target.searchParams.get("state")).toBe("google_calendar");
  });

  test("forwards provider errors to the instance", async () => {
    const target = location(await get(`/mcp/callback?error=access_denied&error_description=No&state=${localState}`));
    expect(target.searchParams.get("error")).toBe("access_denied");
    expect(target.searchParams.get("error_description")).toBe("No");
    expect(target.searchParams.get("code")).toBeNull();
  });

  test("asks a remote instance to confirm and posts back to the relay route", async () => {
    const response = await get(`/mcp/callback?code=abc&state=${remoteState}`, {});
    expect(response.status).toBe(200);
    const page = await response.text();
    expect(page).toContain('<form method="POST" action="/mcp/callback">');
    expect(hiddenFields(page)).toEqual({ code: "abc", state: remoteState });
    const confirmed = await post(
      "/mcp/callback",
      new URLSearchParams({ decision: "continue", code: "abc", state: remoteState }),
      FORM,
      {},
    );
    expect(confirmed.status).toBe(302);
    const target = location(confirmed);
    expect(target.origin + target.pathname).toBe(REMOTE);
    expect(target.searchParams.get("code")).toBe("abc");
  });

  test("rejects states that would open redirect", async () => {
    for (const bad of [
      "",
      `state=${encode({ r: "http://runelay.example.com/v1/oauth/callback", s: "x" })}`,
      `state=${encode({ r: "https://evil.example.com/steal", s: "x" })}`,
      `state=${encode({ r: "javascript:alert(1)", s: "x" })}`,
    ]) {
      const response = await get(`/mcp/callback?code=c&${bad}`, {});
      expect(response.status).toBe(400);
    }
  });

  test("never exchanges tokens and rejects unknown relay routes", async () => {
    const { fetchFn, calls } = upstream();
    const token = await post(
      "/mcp/token",
      new URLSearchParams({ grant_type: "authorization_code", code: "c", code_verifier: "v" }),
      FORM,
      ENV,
      fetchFn,
    );
    expect(token.status).toBe(404);
    expect(calls).toHaveLength(0);
    expect((await get("/mcp/callback/extra")).status).toBe(404);
    expect((await handleRequest(new Request(`${ORIGIN}/mcp/callback`, { method: "PUT" }), ENV)).status).toBe(405);
  });

  test("shares the callback rate limiter", async () => {
    const fake = limiter(1);
    const env: BrokerEnv = { CALLBACK_RATE_LIMITER: fake.binding };
    const headers = { "cf-connecting-ip": "203.0.113.9" };
    expect((await get(`/mcp/callback?code=c&state=${localState}`, env, headers)).status).toBe(302);
    expect((await get(`/mcp/callback?code=c&state=${localState}`, env, headers)).status).toBe(429);
    expect(fake.keys).toEqual(["callback:203.0.113.9", "callback:203.0.113.9"]);
  });
});

describe("mcp client metadata document", () => {
  test("serves a public CIMD whose client_id is its own URL", async () => {
    const response = await get("/mcp/client.json", {});
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("public, max-age=3600");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(await response.json()).toEqual({
      client_id: `${ORIGIN}/mcp/client.json`,
      client_name: "runelay",
      client_uri: "https://runelay.com",
      logo_uri: "https://runelay.com/apple-touch-icon.png",
      redirect_uris: [`${ORIGIN}/mcp/callback`],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    });
  });

  test("only answers GET on the exact path", async () => {
    const response = await handleRequest(new Request(`${ORIGIN}/mcp/client.json`, { method: "POST" }), ENV);
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET");
    expect((await get("/mcp/client.json/extra")).status).toBe(404);
    expect((await get("/google/client.json")).status).toBe(404);
  });
});
