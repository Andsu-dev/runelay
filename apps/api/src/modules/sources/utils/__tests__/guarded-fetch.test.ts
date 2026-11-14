import { afterEach, expect, test } from "bun:test";
import { guardedFetch } from "../guarded-fetch";

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

const stubFetch = (responses: Response[], methods: (string | undefined)[] = []) => {
  const calls: string[] = [];
  globalThis.fetch = Object.assign(
    async (input: string | URL | Request, init?: RequestInit) => {
      calls.push(String(input));
      methods.push(init?.method);
      return responses.shift() ?? new Response("fim");
    },
    { preconnect: realFetch.preconnect },
  );
  return calls;
};

test("blocks a redirect that points to the internal network", async () => {
  const calls = stubFetch([
    new Response(null, { status: 302, headers: { location: "http://169.254.169.254/latest" } }),
  ]);
  await expect(guardedFetch("http://93.184.215.14/start")).rejects.toThrow("rede interna");
  expect(calls).toEqual(["http://93.184.215.14/start"]);
});

test("follows a redirect between public addresses", async () => {
  stubFetch([new Response(null, { status: 302, headers: { location: "http://8.8.8.8/next" } }), new Response("ok")]);
  const response = await guardedFetch("http://93.184.215.14/start");
  expect(await response.text()).toBe("ok");
});

test("blocks private addresses before any request", async () => {
  const calls = stubFetch([]);
  await expect(guardedFetch("http://10.0.0.5/admin")).rejects.toThrow("rede interna");
  expect(calls).toEqual([]);
});

test("switches to GET after a 303 and after a 301 or 302 on POST", async () => {
  const methods: (string | undefined)[] = [];
  stubFetch(
    [
      new Response(null, { status: 302, headers: { location: "/a" } }),
      new Response(null, { status: 307, headers: { location: "/b" } }),
      new Response(null, { status: 303, headers: { location: "/c" } }),
      new Response("ok"),
    ],
    methods,
  );
  const response = await guardedFetch("http://93.184.215.14/start", { method: "POST", body: "x" });
  expect(await response.text()).toBe("ok");
  expect(methods).toEqual(["POST", "GET", "GET", "GET"]);
});

test("keeps the method on a 302 for non POST requests", async () => {
  const methods: (string | undefined)[] = [];
  stubFetch([new Response(null, { status: 302, headers: { location: "/a" } }), new Response("ok")], methods);
  await guardedFetch("http://93.184.215.14/start", { method: "PUT" });
  expect(methods).toEqual(["PUT", "PUT"]);
});

test("returns a redirect response without location as is", async () => {
  stubFetch([new Response(null, { status: 302 })]);
  const response = await guardedFetch("http://93.184.215.14/start");
  expect(response.status).toBe(302);
});

test("rejects non http protocols", async () => {
  await expect(guardedFetch("ftp://93.184.215.14/file")).rejects.toThrow("Protocolo");
});

test("gives up after too many redirects", async () => {
  stubFetch(Array.from({ length: 10 }, () => new Response(null, { status: 302, headers: { location: "/loop" } })));
  await expect(guardedFetch("http://93.184.215.14/start")).rejects.toThrow("Redirecionamentos demais");
});
