import { UserCircleIcon } from "@hugeicons/core-free-icons";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useT } from "@/lib/i18n";
import { meQuery } from "@/modules/auth/api/session.api";
import { ProfileNameField } from "./profile-name-field";
import { ProfilePhotoField } from "./profile-photo-field";
import { SettingsRow } from "./settings-row";
import { SettingsSection } from "./settings-section";

export function ProfileSection() {
  const { data: me } = useSuspenseQuery(meQuery);
  const t = useT();

  return (
    <SettingsSection icon={UserCircleIcon} title={t("settings.profile.title")}>
      <ProfilePhotoField user={me.user} />
      <ProfileNameField user={me.user} />
      <SettingsRow label={t("settings.profile.email")} description={me.user.email} />
    </SettingsSection>
  );
}
