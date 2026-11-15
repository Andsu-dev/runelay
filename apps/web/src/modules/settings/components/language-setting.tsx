import { FlagBr } from "@/components/ui/display/flag-br";
import { FlagUs } from "@/components/ui/display/flag-us";
import { SegmentedControl } from "@/components/ui/display/segmented-control";
import { LOCALES, type Locale, setLocale, useT } from "@/lib/i18n";
import { SettingsRow } from "./settings-row";

const FLAGS: Record<Locale, typeof FlagBr> = { "pt-BR": FlagBr, en: FlagUs };

export function LanguageSetting() {
  const t = useT();
  const options = LOCALES.map((locale) => {
    const Flag = FLAGS[locale];
    return {
      value: locale,
      label: t(`common.languages.${locale}`),
      ariaLabel: t(`settings.preferences.languageNames.${locale}`),
      leading: <Flag />,
    };
  });

  return (
    <SettingsRow label={t("settings.preferences.language")}>
      <SegmentedControl
        options={options}
        value={t.locale}
        onChange={setLocale}
        label={t("settings.preferences.language")}
      />
    </SettingsRow>
  );
}
