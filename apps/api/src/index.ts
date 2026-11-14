import { app } from "@/app";
import { env } from "@/config/env";
import { migrateAuth } from "@/modules/auth/lib/migrate-auth";

await migrateAuth();

Bun.serve({ hostname: env.HOST, port: env.PORT, idleTimeout: 0, fetch: app.fetch });

console.log(`runeley.bot em ${env.PUBLIC_URL} · API em /v1 · MCP em /v1/mcp`);
