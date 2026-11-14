import { parseEnv } from "@runeley/shared";
import { serverEnvSchema } from "./env.schema";

export const env = parseEnv(serverEnvSchema);
