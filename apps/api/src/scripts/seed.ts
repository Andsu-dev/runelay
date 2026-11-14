import { env } from "@/config/env";
import { db } from "@/db/connection";
import { createApiKey } from "@/modules/api-keys/services/api-key.service";
import { auth } from "@/modules/auth/lib/better-auth";
import { migrateAuth } from "@/modules/auth/lib/migrate-auth";
import { SETUP_TOKEN, SETUP_TOKEN_HEADER } from "@/modules/auth/lib/setup-token";
import { ensurePersonalOrganization } from "@/modules/auth/repositories/membership.repository";
import { SEED_API_KEY_NAME, SEED_SOURCES, SEED_USER } from "@/modules/seed/constants/seed.constants";
import { createSource } from "@/modules/sources/services/source.service";

await migrateAuth();

const existing = db.query<{ id: string }, [string]>(`SELECT id FROM "user" WHERE email = ?`).get(SEED_USER.email);
const setupHeaders = new Headers({ [SETUP_TOKEN_HEADER]: SETUP_TOKEN });
const userId = existing?.id ?? (await auth.api.signUpEmail({ body: SEED_USER, headers: setupHeaders })).user.id;

const organization = ensurePersonalOrganization(userId);
if (organization.error || !organization.data) throw new Error(organization.error?.message ?? "Organização não criada");

for (const source of SEED_SOURCES) {
  const created = await createSource(organization.data, source, { authMethod: "session", role: "owner" });
  console.log(`${source.name}: ${created.error ? created.error.message : created.data.status}`);
}

const key = await createApiKey(organization.data, userId, SEED_API_KEY_NAME);
if (key.error) throw new Error(key.error.message);

console.log(`\nBanco: ${env.RUNELEY_DATA}`);
console.log(`Login: ${SEED_USER.email} / ${SEED_USER.password}`);
console.log(`RUNELEY_API_KEY=${key.data.key}`);
process.exit(0);
