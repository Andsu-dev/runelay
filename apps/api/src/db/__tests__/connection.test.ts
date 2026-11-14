import { Database } from "bun:sqlite";
import { afterEach, expect, test } from "bun:test";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { env } from "@/config/env";
import { DATABASE_FILE, LEGACY_DATABASE_FILE } from "@/db/constants";

const originalData = env.RUNELAY_DATA;

afterEach(() => {
  env.RUNELAY_DATA = originalData;
});

const loadConnection = (tag: string): Promise<typeof import("../connection")> => import(`../connection.ts?case=${tag}`);

const freshDir = () => mkdtempSync(join(tmpdir(), "runelay-connection-"));

test("refuses a database that still uses the schema without organizations", async () => {
  const dir = freshDir();
  const old = new Database(join(dir, DATABASE_FILE), { create: true });
  old.run("CREATE TABLE sources (id TEXT PRIMARY KEY)");
  old.close();
  env.RUNELAY_DATA = dir;
  expect(loadConnection("legacy-schema")).rejects.toThrow(dir);
});

test("renames the legacy database file and its wal sidecar", async () => {
  const dir = freshDir();
  const legacy = new Database(join(dir, LEGACY_DATABASE_FILE), { create: true });
  legacy.run("CREATE TABLE marker (id INTEGER)");
  legacy.close();
  writeFileSync(join(dir, `${LEGACY_DATABASE_FILE}-wal`), "");
  env.RUNELAY_DATA = dir;
  const module = await loadConnection("legacy-file");
  expect(existsSync(join(dir, DATABASE_FILE))).toBe(true);
  expect(existsSync(join(dir, LEGACY_DATABASE_FILE))).toBe(false);
  const marker = module.db.query<{ name: string }, []>("SELECT name FROM sqlite_master WHERE name = 'marker'").get();
  expect(marker?.name).toBe("marker");
  module.db.close();
});
