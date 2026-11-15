import { SegmentedControl } from "@/components/ui/display/segmented-control";
import { useT } from "@/lib/i18n";
import { setTheme, useTheme } from "@/lib/theme";
import { THEME_OPTIONS } from "@/modules/settings/constants/settings.constants";
import { SettingsRow } from "./settings-row";

export function ThemeSetting() {
  const theme = useTheme();
  const t = useT();

  return (
    <SettingsRow label={t("settings.preferences.theme")}>
      <SegmentedControl
        options={THEME_OPTIONS.map((option) => ({ ...option, label: t(option.label) }))}
        value={theme}
        onChange={setTheme}
        label={t("settings.preferences.theme")}
      />
    </SettingsRow>
  );
}
