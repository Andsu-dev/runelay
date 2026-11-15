import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactNode } from "react";

interface ExternalLinkButtonProps {
  href: string;
  children: ReactNode;
}

export function ExternalLinkButton({ href, children }: ExternalLinkButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group inline-flex h-8 items-center gap-1.5 rounded-md bg-foreground/5 px-2.5 text-[13px] font-medium transition-colors duration-150 hover:bg-foreground/10"
    >
      {children}
      <HugeiconsIcon
        icon={ArrowUpRight01Icon}
        size={13}
        strokeWidth={2}
        className="text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      />
    </a>
  );
}
