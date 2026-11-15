import { Switch } from "@/components/ui/form/switch";
import { useT } from "@/lib/i18n";
import { setSoundEnabled, useSoundEnabled } from "@/lib/sound";
import { SettingsRow } from "./settings-row";

export function SoundSetting() {
  const soundOn = useSoundEnabled();
  const t = useT();

  return (
    <SettingsRow label={t("settings.preferences.sounds")} description={t("settings.preferences.soundsDescription")}>
      <Switch
        checked={soundOn}
        onCheckedChange={setSoundEnabled}
        label={soundOn ? t("settings.preferences.soundsOff") : t("settings.preferences.soundsOn")}
      />
    </SettingsRow>
  );
}
