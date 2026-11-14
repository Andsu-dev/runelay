import type { MemoryVersionView } from "@runelay/shared";
import { motion } from "motion/react";
import { UI_SPRING } from "@/components/ui/display/spring";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MemoryVersionItemProps {
  version: MemoryVersionView;
  selected: boolean;
  onSelect: (version: MemoryVersionView) => void;
}

export function MemoryVersionItem({ version, selected, onSelect }: MemoryVersionItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(version)}
      aria-pressed={selected}
      className={cn(
        "relative flex min-h-11 w-full flex-col items-start justify-center rounded-lg px-2.5 py-1.5 text-left transition-colors duration-200",
        selected ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {selected && (
        <motion.span
          layoutId="memory-version-active"
          transition={UI_SPRING}
          className="absolute inset-0 rounded-lg bg-muted"
        />
      )}
      <span className="relative text-[13px] font-medium tabular-nums">{formatDateTime(version.createdAt)}</span>
      <span className="relative w-full truncate text-[12px] text-muted-foreground">{version.name}</span>
    </button>
  );
}
