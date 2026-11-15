import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/action/button";
import { DropdownMenu } from "@/components/ui/overlay/dropdown-menu";
import { DropdownMenuItem } from "@/components/ui/overlay/dropdown-menu-item";
import { DropdownMenuSeparator } from "@/components/ui/overlay/dropdown-menu-separator";

export interface FilterOption {
  value: string;
  label: string;
  leading?: ReactNode;
}

interface FilterMenuProps {
  label: string;
  allLabel: string;
  value?: string;
  options: FilterOption[];
  onChange: (value?: string) => void;
}

export function FilterMenu({ label, allLabel, value, options, onChange }: FilterMenuProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <DropdownMenu
      open={open}
      onOpenChange={setOpen}
      align="start"
      className="max-h-80 w-60 overflow-y-auto"
      trigger={
        <Button variant="glass" size="sm" aria-label={label} className="max-w-56">
          {selected?.leading}
          <span className="truncate">{selected?.label ?? allLabel}</span>
          <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={1.8} className="shrink-0 opacity-60" />
        </Button>
      }
    >
      <DropdownMenuItem checked={value === undefined} onSelect={() => onChange(undefined)}>
        {allLabel}
      </DropdownMenuItem>
      {options.length > 0 && <DropdownMenuSeparator />}
      {options.map((option) => (
        <DropdownMenuItem key={option.value} checked={option.value === value} onSelect={() => onChange(option.value)}>
          <span className="flex min-w-0 items-center gap-2">
            {option.leading}
            <span className="truncate">{option.label}</span>
          </span>
        </DropdownMenuItem>
      ))}
    </DropdownMenu>
  );
}
