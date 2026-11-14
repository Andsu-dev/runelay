import { Database } from "bun:sqlite";
import { existsSync, mkdirSync, renameSync } from "node:fs";
import { env } from "@/config/env";
import { DATABASE_FILE, LEGACY_DATABASE_FILE, LEGACY_SCHEMA_MESSAGE } from "./constants";
import { MIGRATIONS } from "./schema";

mkdirSync(env.RUNELAY_DATA, { recursive: true });

const DATABASE_PATH = `${env.RUNELAY_DATA}/${DATABASE_FILE}`;
const LEGACY_DATABASE_PATH = `${env.RUNELAY_DATA}/${LEGACY_DATABASE_FILE}`;

if (!existsSync(DATABASE_PATH) && existsSync(LEGACY_DATABASE_PATH)) {
  for (const suffix of ["", "-wal", "-shm"]) {
    if (existsSync(LEGACY_DATABASE_PATH + suffix)) renameSync(LEGACY_DATABASE_PATH + suffix, DATABASE_PATH + suffix);
  }
}

export const db = new Database(DATABASE_PATH, { create: true, strict: true });

db.run("PRAGMA journal_mode = WAL");

const legacy = db
  .query<{ total: number }, []>(
    `SELECT COUNT(*) AS total FROM sqlite_master m
     WHERE m.name = 'sources' AND NOT EXISTS (SELECT 1 FROM pragma_table_info('sources') WHERE name = 'organization_id')`,
  )
  .get();
if (legacy?.total) throw new Error(LEGACY_SCHEMA_MESSAGE.replace("{dir}", env.RUNELAY_DATA));

const applied = db.query<{ user_version: number }, []>("PRAGMA user_version").get()?.user_version ?? 0;
MIGRATIONS.slice(applied).forEach((sql, index) => {
  db.transaction(() => {
    db.run(sql);
    db.run(`PRAGMA user_version = ${applied + index + 1}`);
  })();
});
