import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface WidgetCardProps {
  icon: IconSvgElement;
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function WidgetCard({ icon, title, meta, children, className }: WidgetCardProps) {
  return (
    <section className={cn("flex h-full flex-col rounded-xl bg-muted/60 p-1 dark:bg-card", className)}>
      <header className="flex min-h-9 items-center gap-2 px-2.5 text-[12px] font-medium text-muted-foreground">
        <HugeiconsIcon icon={icon} size={14} strokeWidth={1.7} className="shrink-0" />
        <h2 className="min-w-0 flex-1 truncate">{title}</h2>
        {meta && <span className="shrink-0 tabular-nums">{meta}</span>}
      </header>
      <div className="flex flex-1 flex-col gap-4 rounded-lg bg-background p-4 shadow-xs dark:bg-muted/40">
        {children}
      </div>
    </section>
  );
}
