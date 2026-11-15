import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { type BrokerFetch, handleRequest } from "../broker";
import worker from "../index";
import type { BrokerEnv } from "../providers";
import { parseState } from "../state";

const ORIGIN = "https://auth.runelay.test";
const ENV: BrokerEnv = { GOOGLE_CLIENT_ID: "client-id", GOOGLE_CLIENT_SECRET: "client-secret" };

const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");

const get = (path: string, env: BrokerEnv = ENV, fetchFn?: BrokerFetch) =>
  handleRequest(new Request(`${ORIGIN}${path}`), env, fetchFn);

const postToken = (body: Record<string, string>, env: BrokerEnv = ENV, fetchFn?: BrokerFetch) =>
  handleRequest(
    new Request(`${ORIGIN}/google/token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(body),
    }),
    env,
    fetchFn,
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

afterEach(() => {
  mock.restore();
});

describe("health", () => {
  test("answers ok", async () => {
    const response = await get("/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});

describe("callback", () => {
  const state = encode({ r: "https://runelay.example.com/v1/oauth/callback", s: "google_calendar" });

  test("redirects the code back to the instance with the original state", async () => {
    const response = await get(`/google/callback?code=abc&state=${state}`);
    expect(response.status).toBe(302);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.origin + location.pathname).toBe("https://runelay.example.com/v1/oauth/callback");
    expect(location.searchParams.get("code")).toBe("abc");
    expect(location.searchParams.get("state")).toBe("google_calendar");
  });

  test("forwards the provider error with its description", async () => {
    const response = await get(`/google/callback?error=access_denied&error_description=Denied&state=${state}`);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.searchParams.get("error")).toBe("access_denied");
    expect(location.searchParams.get("error_description")).toBe("Denied");
    expect(location.searchParams.get("code")).toBeNull();
  });

  test("defaults the error when the provider sends neither code nor error", async () => {
    const response = await get(`/google/callback?state=${state}`);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.searchParams.get("error")).toBe("access_denied");
    expect(location.searchParams.has("error_description")).toBe(false);
  });

  test("allows plain http only for loopback instances", async () => {
    for (const host of ["localhost:4312", "127.0.0.1:4312", "[::1]:4312"]) {
      const local = encode({ r: `http://${host}/v1/oauth/callback`, s: "x" });
      expect((await get(`/google/callback?code=c&state=${local}`)).status).toBe(302);
    }
    const remote = encode({ r: "http://runelay.example.com/v1/oauth/callback", s: "x" });
    expect((await get(`/google/callback?code=c&state=${remote}`)).status).toBe(400);
  });

  test("rejects a missing or malformed state", async () => {
    for (const bad of [
      "",
      "state=",
      "state=not-base64-json",
      `state=${encode(null)}`,
      `state=${encode("text")}`,
      `state=${encode({ r: "https://ok.example.com" })}`,
      `state=${encode({ r: 1, s: "x" })}`,
      `state=${encode({ r: "not a url", s: "x" })}`,
      `state=${encode({ r: "javascript:alert(1)", s: "x" })}`,
    ]) {
      const response = await get(`/google/callback?code=c&${bad}`);
      expect(response.status).toBe(400);
      expect(await response.text()).toBe("Invalid OAuth state.");
    }
  });

  test("decodes non ascii state values", () => {
    expect(parseState(encode({ r: "https://ok.example.com/cb", s: "agenda-ção" }))?.state).toBe("agenda-ção");
  });
});

describe("token", () => {
  test("exchanges a code with the broker secret, redirect and verifier", async () => {
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

  test("refreshes without a redirect uri and passes errors through", async () => {
    const fake = upstream(400, { error: "invalid_grant" }, false);
    const response = await postToken({ grant_type: "refresh_token", refresh_token: "rt" }, ENV, fake.fetchFn);
    expect(response.status).toBe(400);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(await response.json()).toEqual({ error: "invalid_grant" });
    expect(Object.fromEntries(fake.form())).toEqual({
      grant_type: "refresh_token",
      refresh_token: "rt",
      client_id: "client-id",
      client_secret: "client-secret",
    });
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

describe("routing", () => {
  test("answers 404 for unknown providers, actions, methods and paths", async () => {
    const paths = ["/", "/github/callback", "/constructor/callback", "/google/other", "/google/callback/extra"];
    for (const path of paths) expect((await get(path)).status).toBe(404);
    expect((await get("/google/token")).status).toBe(404);
    expect((await handleRequest(new Request(`${ORIGIN}/google/callback`, { method: "POST" }), ENV)).status).toBe(404);
    expect((await handleRequest(new Request(`${ORIGIN}/health`, { method: "POST" }), ENV)).status).toBe(404);
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
