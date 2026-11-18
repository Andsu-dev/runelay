import { z } from "zod";
import { googleServicesSchema, sourceNameSchema } from "../sources/source.schema";

export const catalogQuerySchema = z.object({
  query: z.string().trim().max(120).optional(),
});

export const installCatalogSchema = z.object({
  id: z.string().trim().min(1),
  token: z.string().trim().min(1).optional(),
  services: googleServicesSchema.optional(),
  name: sourceNameSchema.optional(),
});
