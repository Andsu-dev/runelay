import { cn } from "@/lib/utils";

interface MonogramTileProps {
  label: string;
  className?: string;
}

export function MonogramTile({ label, className }: MonogramTileProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted font-mono text-[13px] font-semibold text-foreground uppercase",
        className,
      )}
    >
      {label.trim().charAt(0) || "?"}
    </span>
  );
}
