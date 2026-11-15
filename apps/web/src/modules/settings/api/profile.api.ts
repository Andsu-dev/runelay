import type { UpdateProfileInput } from "@runelay/shared";
import { authClient } from "@/lib/auth-client";
import { translate } from "@/lib/i18n";

export const updateProfile = async (input: UpdateProfileInput) => {
  const { error } = await authClient.updateUser(input);
  if (error) throw new Error(error.message ?? translate("settings.profile.saveFailed"));
};
