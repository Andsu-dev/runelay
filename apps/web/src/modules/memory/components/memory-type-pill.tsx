import type { MemoryType } from "@runelay/shared";
import { MEMORY_TYPE_LABEL } from "@/modules/memory/constants/memory.constants";

interface MemoryTypePillProps {
  type: MemoryType;
}

export function MemoryTypePill({ type }: MemoryTypePillProps) {
  return (
    <span className="shrink-0 rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      {MEMORY_TYPE_LABEL[type]}
    </span>
  );
}
