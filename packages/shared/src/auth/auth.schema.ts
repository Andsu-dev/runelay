import { z } from "zod";
import { PROFILE_IMAGE_MAX_LENGTH, PROFILE_NAME_MAX_LENGTH } from "./auth.constants";

export const profileImageSchema = z
  .union([
    z
      .string()
      .max(PROFILE_IMAGE_MAX_LENGTH)
      .regex(/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/),
    z.url({ protocol: /^https$/ }).max(2048),
  ])
  .nullable();

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(PROFILE_NAME_MAX_LENGTH),
    image: profileImageSchema,
  })
  .partial();
