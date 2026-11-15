import { type AuthUser, updateProfileSchema } from "@runelay/shared";
import { translate, useT } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { useUpdateProfile } from "@/modules/settings/hooks/use-update-profile";
import { InlineEditText } from "./inline-edit-text";

interface ProfileNameFieldProps {
  user: AuthUser;
}

const normalizeName = (draft: string) => {
  const parsed = updateProfileSchema.safeParse({ name: draft });
  return parsed.success ? (parsed.data.name ?? null) : null;
};

export function ProfileNameField({ user }: ProfileNameFieldProps) {
  const update = useUpdateProfile();
  const t = useT();

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[13px] font-medium">{t("settings.profile.name")}</span>
      <InlineEditText
        value={user.name}
        normalize={normalizeName}
        onSave={(name) => update.mutate({ name }, { onSuccess: () => toast(translate("settings.profile.nameSaved")) })}
        inputLabel={t("settings.profile.name")}
        editLabel={t("settings.profile.editName")}
        saveLabel={t("settings.profile.saveName")}
        cancelLabel={t("settings.profile.cancel")}
        disabled={update.isPending}
      />
    </div>
  );
}
