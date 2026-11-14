import type { z } from "zod";
import type { clientServerSchema } from "./client-config.schema";

export type ClientServer = z.infer<typeof clientServerSchema>;

export type EnvMap = Record<string, string | undefined>;
