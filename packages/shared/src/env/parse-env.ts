import type { z } from "zod";

export const parseEnv = <T extends z.ZodType>(schema: T): z.infer<T> => {
  const parsed = schema.safeParse(process.env);
  if (parsed.success) return parsed.data;
  const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n");
  throw new Error(`Env inválido:\n${issues}`);
};
