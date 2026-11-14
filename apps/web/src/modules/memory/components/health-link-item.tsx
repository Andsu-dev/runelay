import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

interface HealthLinkItemProps {
  slug: string;
  children: ReactNode;
  meta?: ReactNode;
}

export function HealthLinkItem({ slug, children, meta }: HealthLinkItemProps) {
  return (
    <li>
      <Link
        to="/memory/$slug"
        params={{ slug }}
        className="flex min-h-9 items-center gap-2 rounded-md px-2 text-[12px] text-muted-foreground transition-colors duration-200 hover:bg-foreground/[0.04] hover:text-foreground sm:min-h-7"
      >
        <span className="min-w-0 flex-1 truncate">{children}</span>
        {meta && <span className="shrink-0 tabular-nums">{meta}</span>}
      </Link>
    </li>
  );
}
