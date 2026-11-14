import type { IconSvgElement } from "@hugeicons/react";
import { IconAction } from "@/components/ui/action/icon-action";

interface RailButtonProps {
  icon: IconSvgElement;
  label: string;
  onClick: () => void;
}

export function RailButton({ icon, label, onClick }: RailButtonProps) {
  return <IconAction icon={icon} label={label} onClick={onClick} size="icon" side="right" />;
}
