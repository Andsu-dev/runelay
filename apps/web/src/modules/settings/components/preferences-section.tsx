import { SlidersHorizontalIcon } from "@hugeicons/core-free-icons";
import { useT } from "@/lib/i18n";
import { LanguageSetting } from "./language-setting";
import { SettingsSection } from "./settings-section";
import { SoundSetting } from "./sound-setting";
import { ThemeSetting } from "./theme-setting";

export function PreferencesSection() {
  const t = useT();
  return (
    <SettingsSection icon={SlidersHorizontalIcon} title={t("settings.preferences.title")}>
      <SoundSetting />
      <ThemeSetting />
      <LanguageSetting />
    </SettingsSection>
  );
}
