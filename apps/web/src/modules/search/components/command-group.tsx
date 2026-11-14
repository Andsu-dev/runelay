import type { ReactNode } from "react";

interface CommandGroupProps {
  label: string;
  children: ReactNode;
}

export function CommandGroup({ label, children }: CommandGroupProps) {
  return (
    <section className="flex flex-col gap-0.5">
      <h3 className="px-2.5 pt-2 pb-1 text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
        {label}
      </h3>
      {children}
    </section>
  );
}
