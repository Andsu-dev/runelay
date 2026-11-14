import { parseEnv } from "@runelay/shared";
import { serverEnvSchema } from "./env.schema";

export const env = parseEnv(serverEnvSchema);
