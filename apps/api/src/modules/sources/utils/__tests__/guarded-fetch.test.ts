import { afterEach, expect, test } from "bun:test";
import { guardedFetch } from "../guarded-fetch";

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

const stubFetch = (responses: Response[]) => {
  const calls: string[] = [];
  globalThis.fetch = Object.assign(
    async (input: string | URL | Request) => {
      calls.push(String(input));
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
