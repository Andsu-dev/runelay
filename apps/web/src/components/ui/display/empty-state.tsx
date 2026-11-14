import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: IconSvgElement;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-card px-6 py-10 text-center">
      <HugeiconsIcon icon={icon} size={22} strokeWidth={1.5} className="text-muted-foreground" />
      <div className="flex max-w-sm flex-col gap-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-[13px] text-pretty text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
