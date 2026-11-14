import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import type { ComponentProps } from "react";
import { Tooltip } from "@/components/ui/overlay/tooltip";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface IconActionProps extends Omit<ComponentProps<typeof Button>, "children" | "size"> {
  icon: IconSvgElement;
  label: string;
  spinning?: boolean;
  tone?: "default" | "destructive";
  size?: "icon" | "icon-sm";
  side?: "top" | "right" | "bottom" | "left";
}

export function IconAction({
  icon,
  label,
  spinning,
  tone = "default",
  variant = "ghost",
  size = "icon-sm",
  side,
  className,
  ...props
}: IconActionProps) {
  return (
    <Tooltip content={label} side={side} hideArrow>
      <Button
        {...props}
        variant={variant}
        size={size}
        aria-label={label}
        className={cn(tone === "destructive" && "not-disabled:hover:text-destructive", className)}
      >
        <HugeiconsIcon icon={icon} size={16} strokeWidth={1.6} className={cn(spinning && "animate-spin")} />
      </Button>
    </Tooltip>
  );
}
