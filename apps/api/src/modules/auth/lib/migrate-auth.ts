import { getMigrations } from "better-auth/db/migration";
import { auth } from "@/modules/auth/lib/better-auth";

export const migrateAuth = async () => {
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();
};
