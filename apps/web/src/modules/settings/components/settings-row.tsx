import type { ReactNode } from "react";

interface SettingsRowProps {
  label: string;
  description?: ReactNode;
  children?: ReactNode;
}

export function SettingsRow({ label, description, children }: SettingsRowProps) {
  return (
    <div className="flex min-h-10 flex-wrap items-center gap-x-3 gap-y-2">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[13px] font-medium">{label}</span>
        {description && <span className="truncate text-[12px] text-muted-foreground">{description}</span>}
      </span>
      {children}
    </div>
  );
}
