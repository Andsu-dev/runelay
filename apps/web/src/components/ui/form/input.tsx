import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground bg-muted/60 dark:bg-input/40 h-9 w-full min-w-0 rounded-md px-3 py-1 text-base shadow-[0_1px_1px_rgba(0,0,0,0.015)] transition-[color,box-shadow,background-color,border-color] duration-200 ease-[cubic-bezier(0.2,0,0,1)] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:shadow-none",
        "hover:bg-muted dark:hover:bg-input/60 border border-transparent focus-visible:ring-2 focus-visible:ring-ring/30",
        "aria-invalid:ring-2 aria-invalid:ring-destructive aria-invalid:animate-shake",
        "autofill:bg-primary/5 autofill:text-foreground",
        "placeholder:transition-opacity placeholder:duration-200 focus:placeholder:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
