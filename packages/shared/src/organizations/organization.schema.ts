import { z } from "zod";
import { profileImageSchema } from "../auth/auth.schema";

export const organizationSlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(48)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use letras minúsculas, números e hífen");

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: organizationSlugSchema,
});

export const updateOrganizationSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    logo: profileImageSchema,
  })
  .partial();

export const setActiveOrganizationSchema = z.object({
  organizationId: z.string().min(1),
});
