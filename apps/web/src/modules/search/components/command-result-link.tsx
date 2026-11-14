import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Link, type LinkProps } from "@tanstack/react-router";

interface CommandResultLinkProps {
  icon: IconSvgElement;
  title: string;
  description: string;
  link: LinkProps;
  onNavigate: () => void;
}

export function CommandResultLink({ icon, title, description, link, onNavigate }: CommandResultLinkProps) {
  return (
    <Link
      {...link}
      onClick={onNavigate}
      className="flex min-h-11 items-center gap-3 rounded-lg px-2.5 py-2 outline-none transition-colors duration-150 hover:bg-foreground/[0.06] focus-visible:bg-foreground/[0.06]"
    >
      <HugeiconsIcon icon={icon} size={16} strokeWidth={1.6} className="shrink-0 text-muted-foreground" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13px] font-medium">{title}</span>
        {description && <span className="truncate text-xs text-muted-foreground">{description}</span>}
      </span>
    </Link>
  );
}
