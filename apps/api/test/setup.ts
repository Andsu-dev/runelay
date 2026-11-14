import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.RUNELAY_SECRET = "test-secret-0123456789abcdef0123456789abcdef";
process.env.RUNELAY_DATA = mkdtempSync(join(tmpdir(), "runelay-test-"));
process.env.RUNELAY_SETUP_TOKEN = "test-setup-token-0123";
process.env.PUBLIC_URL = "http://localhost:4312";
process.env.ALLOW_SIGNUP = "true";
process.env.GITHUB_CLIENT_ID = "test-github-client";
process.env.GITHUB_CLIENT_SECRET = "test-github-secret";
process.env.WEB_DIST = join(import.meta.dir, "fixtures/web");

const { migrateAuth } = await import("@/modules/auth/lib/migrate-auth");
await migrateAuth();
