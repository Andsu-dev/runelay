import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";

interface SettingsSectionProps {
  icon: IconSvgElement;
  title: string;
  children: ReactNode;
}

export function SettingsSection({ icon, title, children }: SettingsSectionProps) {
  return (
    <section className="flex flex-col rounded-xl bg-muted/60 p-1 dark:bg-card">
      <header className="flex min-h-9 items-center gap-2 px-2.5 text-[12px] font-medium text-muted-foreground">
        <HugeiconsIcon icon={icon} size={14} strokeWidth={1.7} className="shrink-0" />
        <h2 className="min-w-0 flex-1 truncate">{title}</h2>
      </header>
      <div className="flex flex-col gap-4 rounded-lg bg-background p-4 shadow-xs dark:bg-muted/40">{children}</div>
    </section>
  );
}
