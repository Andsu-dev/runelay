import { Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { OrganizationView } from "@runelay/shared";
import { cn } from "@/lib/utils";
import { OrganizationTile } from "./organization-tile";

interface OrganizationOptionProps {
  organization: OrganizationView;
  active: boolean;
  onSelect: (organization: OrganizationView) => void;
}

export function OrganizationOption({ organization, active, onSelect }: OrganizationOptionProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(organization)}
      aria-current={active || undefined}
      className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2 text-left text-[13px] font-medium transition-colors duration-150 hover:bg-foreground/[0.06] sm:min-h-9"
    >
      <OrganizationTile name={organization.name} seed={organization.id} logo={organization.logo} />
      <span className="min-w-0 flex-1 truncate">{organization.name}</span>
      <HugeiconsIcon
        icon={Tick02Icon}
        size={15}
        strokeWidth={2}
        className={cn(
          "shrink-0 transition-[opacity,scale] duration-150",
          active ? "opacity-100" : "scale-75 opacity-0",
        )}
      />
    </button>
  );
}
