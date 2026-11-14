import type { ReactNode } from "react";

interface PanelSectionProps {
  label: string;
  children: ReactNode;
}

export function PanelSection({ label, children }: PanelSectionProps) {
  return (
    <section className="flex flex-col gap-0.5">
      <h2 className="px-2.5 pb-1.5 text-[11px] tracking-[0.08em] text-muted-foreground/70 uppercase">{label}</h2>
      {children}
    </section>
  );
}
