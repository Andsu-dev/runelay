import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Switch as SwitchPrimitive } from "radix-ui";
import { Tooltip } from "@/components/ui/overlay/tooltip";
import { cn } from "@/lib/utils";

interface SwitchProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  disabledReason?: string;
  label?: string;
  className?: string;
}

export function Switch({
  id,
  checked,
  onCheckedChange,
  disabled = false,
  disabledReason,
  label,
  className,
}: SwitchProps) {
  return (
    <div className={cn("flex items-center justify-end gap-2.5", className)}>
      {disabled && disabledReason && (
        <Tooltip content={disabledReason}>
          <button
            type="button"
            aria-label={disabledReason}
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground/60 transition-colors outline-none hover:text-muted-foreground"
          >
            <HugeiconsIcon icon={InformationCircleIcon} size={15} strokeWidth={1.5} />
          </button>
        </Tooltip>
      )}

      <SwitchPrimitive.Root
        data-sound="toggle"
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-label={label}
        className={cn(
          "relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border border-transparent bg-input transition-colors duration-200 outline-none",
          "after:absolute after:inset-x-0 after:-inset-y-2.5 after:content-['']",
          "data-[state=checked]:bg-primary",
          "focus-visible:ring-2 focus-visible:ring-ring/30",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        <SwitchPrimitive.Thumb className="pointer-events-none block size-5 translate-x-0.5 rounded-full bg-background shadow-xs transition-transform duration-200 data-[state=checked]:translate-x-4.5" />
      </SwitchPrimitive.Root>
    </div>
  );
}
