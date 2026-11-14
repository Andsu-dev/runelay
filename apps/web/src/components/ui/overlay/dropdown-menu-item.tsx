import { Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuItemProps {
  children: ReactNode;
  icon?: IconSvgElement;
  destructive?: boolean;
  disabled?: boolean;
  onSelect?: (event: Event) => void;
  checked?: boolean;
  className?: string;
}

export function DropdownMenuItem({
  children,
  icon,
  destructive = false,
  disabled = false,
  onSelect,
  checked,
  className,
}: DropdownMenuItemProps) {
  const shared = {
    disabled,
    onSelect,
    className: cn(
      "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium outline-none transition-colors duration-150 sm:min-h-8",
      "data-disabled:pointer-events-none data-disabled:opacity-50",
      destructive ? "text-destructive data-highlighted:bg-destructive/10" : "data-highlighted:bg-foreground/[0.06]",
      className,
    ),
  };
  const leading = icon && <HugeiconsIcon icon={icon} size={15} strokeWidth={1.5} className="shrink-0" />;

  if (checked === undefined)
    return (
      <DropdownMenuPrimitive.Item {...shared}>
        {leading}
        {children}
      </DropdownMenuPrimitive.Item>
    );

  return (
    <DropdownMenuPrimitive.CheckboxItem {...shared} checked={checked}>
      {leading}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <HugeiconsIcon
        icon={Tick02Icon}
        size={15}
        strokeWidth={2}
        className={cn(
          "shrink-0 transition-[opacity,scale] duration-150",
          checked ? "scale-100 opacity-100" : "scale-75 opacity-0",
        )}
      />
    </DropdownMenuPrimitive.CheckboxItem>
  );
}
