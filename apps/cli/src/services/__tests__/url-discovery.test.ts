import { afterEach, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const home = mkdtempSync(join(tmpdir(), "runelay-discovery-"));
process.env.RUNELAY_HOME = home;

const { discoverUrl } = await import("../../commands/login.command");
const { DESKTOP_DISCOVERY_FILE: desktopFile } = await import("../../constants/cli.constants");
const original = globalThis.fetch;

const serve = (healthy: string[]) => {
  const probed: string[] = [];
  globalThis.fetch = (async (input: string | URL | Request) => {
    const { origin } = new URL(String(input));
    probed.push(origin);
    return new Response(healthy.includes(origin) ? "ok" : "nope", { status: healthy.includes(origin) ? 200 : 503 });
  }) as typeof fetch;
  return probed;
};

const writeDesktop = (content: string) => {
  mkdirSync(dirname(desktopFile), { recursive: true });
  writeFileSync(desktopFile, content);
};

afterEach(() => {
  globalThis.fetch = original;
  rmSync(desktopFile, { force: true });
});

test("the desktop app's published url wins over the default port", async () => {
  writeDesktop(JSON.stringify({ url: "http://127.0.0.1:4317", pid: 42 }));
  const probed = serve(["http://127.0.0.1:4317", "http://localhost:4312"]);
  expect(await discoverUrl()).toBe("http://127.0.0.1:4317");
  expect(probed).toEqual(["http://127.0.0.1:4317"]);
});

test("a stale desktop file falls back to localhost:4312", async () => {
  writeDesktop(JSON.stringify({ url: "http://127.0.0.1:4320", pid: 42 }));
  const probed = serve(["http://localhost:4312"]);
  expect(await discoverUrl()).toBe("http://localhost:4312");
  expect(probed).toEqual(["http://127.0.0.1:4320", "http://localhost:4312"]);
});

test("a missing or broken desktop file is ignored", async () => {
  serve(["http://localhost:4312"]);
  expect(await discoverUrl()).toBe("http://localhost:4312");
  writeDesktop("{not json");
  expect(await discoverUrl()).toBe("http://localhost:4312");
  writeDesktop(JSON.stringify({ pid: 1 }));
  serve([]);
  expect(await discoverUrl()).toBeNull();
});
