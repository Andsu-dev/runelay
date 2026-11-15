import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ReactNode, useState } from "react";
import type { MessageKey } from "@/lib/i18n";
import { useT } from "@/lib/i18n";
import { readStorage, writeStorage } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface PanelSectionProps {
  label: MessageKey;
  children: ReactNode;
  collapsible?: boolean;
}

const LABEL = "px-2.5 pb-1.5 text-[11px] tracking-[0.08em] text-muted-foreground/70 uppercase";

export function PanelSection({ label, children, collapsible = false }: PanelSectionProps) {
  const t = useT();
  const storageKey = `runelay-panel-section:${label}`;
  const [collapsed, setCollapsed] = useState(() => collapsible && readStorage(storageKey) === "true");

  if (!collapsible)
    return (
      <section className="flex flex-col gap-0.5">
        <h2 className={LABEL}>{t(label)}</h2>
        {children}
      </section>
    );

  const toggle = () => {
    setCollapsed(!collapsed);
    writeStorage(storageKey, collapsed ? null : "true");
  };

  return (
    <section className="flex flex-col gap-0.5">
      <h2>
        <button
          type="button"
          aria-expanded={!collapsed}
          onClick={toggle}
          className={cn(
            LABEL,
            "group flex w-full items-center gap-1 rounded-md text-left outline-none transition-colors duration-200 hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/25",
          )}
        >
          {t(label)}
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={12}
            strokeWidth={2}
            className={cn(
              "transition-[transform,opacity] duration-200 ease-out",
              collapsed
                ? "-rotate-90 opacity-100"
                : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100",
            )}
          />
        </button>
      </h2>
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
        )}
        inert={collapsed || undefined}
      >
        <div className="flex min-h-0 flex-col gap-0.5 overflow-hidden">{children}</div>
      </div>
    </section>
  );
}
