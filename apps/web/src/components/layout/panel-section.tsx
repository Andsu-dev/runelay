import type { ReactNode } from "react";
import type { MessageKey } from "@/lib/i18n";
import { useT } from "@/lib/i18n";

interface PanelSectionProps {
  label: MessageKey;
  children: ReactNode;
}

export function PanelSection({ label, children }: PanelSectionProps) {
  const t = useT();

  return (
    <section className="flex flex-col gap-0.5">
      <h2 className="px-2.5 pb-1.5 text-[11px] tracking-[0.08em] text-muted-foreground/70 uppercase">{t(label)}</h2>
      {children}
    </section>
  );
}
