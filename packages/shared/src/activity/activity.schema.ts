import { z } from "zod";
import { paginationSchema } from "../pagination/pagination.schema";

export const activityRangeSchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(30),
});

export const ACTIVITY_STATUSES = ["ok", "error"] as const;

export const activityCallsSchema = paginationSchema.extend({
  keyId: z.string().trim().min(1).max(200).optional(),
  source: z.string().trim().min(1).max(200).optional(),
  status: z.enum(ACTIVITY_STATUSES).optional(),
  query: z.string().trim().min(1).max(120).optional(),
});

export const toolSearchSchema = z.object({
  query: z.string().trim().max(120).optional(),
  source: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
