import { ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { setNamesHidden, useNamesHidden } from "@/lib/hidden-names";
import { IconAction } from "./icon-action";

export function HideNamesToggle() {
  const hidden = useNamesHidden();

  return (
    <IconAction
      icon={hidden ? ViewOffSlashIcon : ViewIcon}
      label={hidden ? "Mostrar nomes" : "Esconder nomes"}
      aria-pressed={hidden}
      size="icon"
      onClick={() => setNamesHidden(!hidden)}
    />
  );
}
