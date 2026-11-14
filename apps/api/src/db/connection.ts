import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { env } from "@/config/env";
import { LEGACY_SCHEMA_MESSAGE } from "./constants";
import { MIGRATIONS } from "./schema";

mkdirSync(env.RUNELEY_DATA, { recursive: true });

export const db = new Database(`${env.RUNELEY_DATA}/runeley.db`, { create: true, strict: true });

db.run("PRAGMA journal_mode = WAL");

const legacy = db
  .query<{ total: number }, []>(
    `SELECT COUNT(*) AS total FROM sqlite_master m
     WHERE m.name = 'sources' AND NOT EXISTS (SELECT 1 FROM pragma_table_info('sources') WHERE name = 'organization_id')`,
  )
  .get();
if (legacy?.total) throw new Error(LEGACY_SCHEMA_MESSAGE.replace("{dir}", env.RUNELEY_DATA));

const applied = db.query<{ user_version: number }, []>("PRAGMA user_version").get()?.user_version ?? 0;
MIGRATIONS.slice(applied).forEach((sql, index) => {
  db.transaction(() => {
    db.run(sql);
    db.run(`PRAGMA user_version = ${applied + index + 1}`);
  })();
});
