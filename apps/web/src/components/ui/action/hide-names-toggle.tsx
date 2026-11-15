import { ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { setNamesHidden, useNamesHidden } from "@/lib/hidden-names";
import { useT } from "@/lib/i18n";
import { IconAction } from "./icon-action";

export function HideNamesToggle() {
  const t = useT();
  const hidden = useNamesHidden();

  return (
    <IconAction
      icon={hidden ? ViewOffSlashIcon : ViewIcon}
      label={hidden ? t("layout.ui.showNames") : t("layout.ui.hideNames")}
      aria-pressed={hidden}
      size="icon"
      onClick={() => setNamesHidden(!hidden)}
    />
  );
}
