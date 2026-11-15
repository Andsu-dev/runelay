import { Add01Icon } from "@hugeicons/core-free-icons";
import { IconAction } from "@/components/ui/action/icon-action";
import { useT } from "@/lib/i18n";

interface InstallConnectorButtonProps {
  name: string;
  pending: boolean;
  onInstall: () => void;
}

export function InstallConnectorButton({ name, pending, onInstall }: InstallConnectorButtonProps) {
  const t = useT();

  return (
    <IconAction
      icon={Add01Icon}
      label={t("catalog.install", { name })}
      variant="glass"
      onClick={onInstall}
      disabled={pending}
    />
  );
}
