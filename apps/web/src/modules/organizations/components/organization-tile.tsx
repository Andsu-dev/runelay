import { avatarGradient } from "@/lib/avatar-gradient";
import { cn } from "@/lib/utils";

interface OrganizationTileProps {
  name: string;
  seed: string;
  className?: string;
}

export function OrganizationTile({ name, seed, className }: OrganizationTileProps) {
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
