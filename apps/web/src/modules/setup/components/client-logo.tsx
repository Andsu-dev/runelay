import { ComputerTerminal01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

interface ClientLogoProps {
  logo: { light: string; dark: string; scale?: number } | null;
  inverted?: boolean;
}

export function ClientLogo({ logo, inverted = false }: ClientLogoProps) {
  if (!logo) return <HugeiconsIcon icon={ComputerTerminal01Icon} size={16} strokeWidth={1.7} className="shrink-0" />;
  return (
    <span aria-hidden className="relative size-4 shrink-0" style={{ scale: logo.scale ?? 1 }}>
      <img
        src={logo.light}
        alt=""
        className={cn("absolute inset-0 size-4 object-contain", inverted ? "hidden dark:block" : "dark:hidden")}
      />
      <img
        src={logo.dark}
        alt=""
        className={cn("absolute inset-0 size-4 object-contain", inverted ? "dark:hidden" : "hidden dark:block")}
      />
    </span>
  );
}
