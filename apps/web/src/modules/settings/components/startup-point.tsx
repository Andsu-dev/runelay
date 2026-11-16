import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

interface StartupPointProps {
  icon: IconSvgElement;
  label: string;
}

export function StartupPoint({ icon, label }: StartupPointProps) {
  return (
    <li className="flex items-start gap-2.5 text-[13px] text-pretty text-foreground/85">
      <HugeiconsIcon icon={icon} size={15} strokeWidth={1.7} className="mt-0.5 shrink-0 text-muted-foreground" />
      {label}
    </li>
  );
}
