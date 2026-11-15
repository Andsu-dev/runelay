import type { MemoryType } from "@runelay/shared";
import { useT } from "@/lib/i18n";
import { MEMORY_TYPE_LABEL } from "@/modules/memory/constants/memory.constants";

interface MemoryTypePillProps {
  type: MemoryType;
}

export function MemoryTypePill({ type }: MemoryTypePillProps) {
  const t = useT();

  return (
    <span className="shrink-0 rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      {t(MEMORY_TYPE_LABEL[type])}
    </span>
  );
}
