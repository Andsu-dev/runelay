import { useState } from "react";
import { avatarGradient } from "@/lib/avatar-gradient";
import { cn } from "@/lib/utils";

interface OrganizationTileProps {
  name: string;
  seed: string;
  logo?: string | null;
  className?: string;
}

export function OrganizationTile({ name, seed, logo, className }: OrganizationTileProps) {
  const [failedLogo, setFailedLogo] = useState<string | null>(null);

  if (logo && logo !== failedLogo)
    return (
      <img
        src={logo}
        alt=""
        aria-hidden
        draggable={false}
        onError={() => setFailedLogo(logo)}
        className={cn("size-5 shrink-0 rounded-md bg-muted object-cover shadow-xs", className)}
      />
    );

  return (
    <span
      aria-hidden
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold text-black/70 uppercase shadow-xs",
        avatarGradient(seed),
        className,
      )}
    >
      {name.trim().charAt(0) || "?"}
    </span>
  );
}
