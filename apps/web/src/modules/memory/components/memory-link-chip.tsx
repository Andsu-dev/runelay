import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface MemoryLinkChipProps {
  slug: string;
  broken?: boolean;
}

export function MemoryLinkChip({ slug, broken = false }: MemoryLinkChipProps) {
  const className = cn(
    "inline-flex min-h-8 items-center rounded-md px-2 font-mono text-[12px] transition-colors duration-200 sm:min-h-7",
    broken
      ? "bg-destructive/10 text-destructive line-through decoration-destructive/40"
      : "bg-foreground/[0.06] text-foreground hover:bg-foreground/10",
  );

  if (broken) {
    return (
      <span className={className} title="Essa memória não existe">
        [[{slug}]]
      </span>
    );
  }

  return (
    <Link to="/memory/$slug" params={{ slug }} className={className}>
      [[{slug}]]
    </Link>
  );
}
