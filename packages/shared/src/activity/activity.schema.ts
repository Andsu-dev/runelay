import { z } from "zod";

export const activityRangeSchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(30),
});

export const toolSearchSchema = z.object({
  query: z.string().trim().max(120).optional(),
  source: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
