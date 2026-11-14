import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
}

export function Field({ label, hint, error, className, children }: FieldProps) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[13px] font-medium">{label}</span>
      {children}
      {error ? (
        <span className="text-xs text-destructive">{error}</span>
      ) : (
        hint && <span className="text-xs text-muted-foreground">{hint}</span>
      )}
    </label>
  );
}
