import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends Omit<ComponentProps<"textarea">, "value"> {
  value: string;
  counter?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  wrapperClassName?: string;
}

export function Textarea({
  className,
  wrapperClassName,
  value,
  counter = false,
  header,
  footer,
  maxLength,
  ...props
}: TextareaProps) {
  return (
    <div
      data-slot="textarea"
      className={cn(
        "flex flex-col rounded-md bg-muted/60 shadow-[0_1px_1px_rgba(0,0,0,0.015)] transition-[color,box-shadow,background-color,border-color] duration-200 ease-[cubic-bezier(0.2,0,0,1)] dark:bg-input/40 dark:shadow-none",
        "overflow-hidden border border-transparent hover:bg-muted dark:hover:bg-input/60 focus-within:ring-2 focus-within:ring-ring/30",
        "has-[textarea[aria-invalid=true]]:ring-2 has-[textarea[aria-invalid=true]]:ring-destructive",
        "has-[textarea:disabled]:opacity-50",
        wrapperClassName,
      )}
    >
      {header && <div className="flex items-center border-b border-border px-1.5 py-1">{header}</div>}

      <textarea
        value={value}
        maxLength={maxLength}
        className={cn(
          "min-h-24 w-full resize-none bg-transparent px-3 py-2.5 text-base leading-relaxed outline-none placeholder:text-muted-foreground placeholder:transition-opacity placeholder:duration-200 focus:placeholder:opacity-60 disabled:cursor-not-allowed md:text-sm",
          className,
        )}
        {...props}
      />

      {counter && (
        <div className="flex items-center px-3 pb-2.5">
          <span className="ml-auto shrink-0 text-[12px] tabular-nums text-muted-foreground">
            {maxLength ? `${value.length}/${maxLength}` : value.length}
          </span>
        </div>
      )}

      {footer}
    </div>
  );
}
