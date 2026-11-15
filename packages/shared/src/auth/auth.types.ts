import type { z } from "zod";
import type { updateProfileSchema } from "./auth.schema";

export interface SetupStatusView {
  needsSetup: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
}

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
