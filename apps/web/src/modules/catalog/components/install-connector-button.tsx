import { Add01Icon } from "@hugeicons/core-free-icons";
import { IconAction } from "@/components/ui/action/icon-action";

interface InstallConnectorButtonProps {
  name: string;
  pending: boolean;
  onInstall: () => void;
}

export function InstallConnectorButton({ name, pending, onInstall }: InstallConnectorButtonProps) {
  return (
    <IconAction icon={Add01Icon} label={`Instalar ${name}`} variant="glass" onClick={onInstall} disabled={pending} />
  );
}
