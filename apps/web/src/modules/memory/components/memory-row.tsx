import { ArrowLeft02Icon, ArrowRight01Icon, PinIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { MemoryListItemView } from "@runelay/shared";
import { Link } from "@tanstack/react-router";
import { MaskedName } from "@/components/ui/display/masked-name";
import { formatDate } from "@/lib/format";
import { MemoryTypePill } from "./memory-type-pill";

interface MemoryRowProps {
  memory: MemoryListItemView;
}

export function MemoryRow({ memory }: MemoryRowProps) {
  return (
    <Link
      to="/memory/$slug"
      params={{ slug: memory.slug }}
      className="flex min-h-16 flex-col gap-1 rounded-xl px-3 py-2.5 transition-colors duration-200 hover:bg-muted/50 sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          {memory.pinned && (
            <HugeiconsIcon icon={PinIcon} size={13} strokeWidth={1.8} className="shrink-0 text-muted-foreground" />
          )}
          <MaskedName value={memory.name} className="text-[13px] font-semibold" />
          <MemoryTypePill type={memory.type} />
        </span>
        <span className="line-clamp-1 text-[12px] text-muted-foreground">
          {memory.description || <MaskedName value={memory.slug} />}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-[12px] text-muted-foreground tabular-nums">
        <span className="flex items-center gap-1" title="Links para outras memórias">
          <HugeiconsIcon icon={ArrowRight01Icon} size={13} strokeWidth={1.8} />
          {memory.linkCount}
        </span>
        <span className="flex items-center gap-1" title="Memórias que apontam para esta">
          <HugeiconsIcon icon={ArrowLeft02Icon} size={13} strokeWidth={1.8} />
          {memory.backlinkCount}
        </span>
        <span className="min-w-20 text-right">{formatDate(memory.updatedAt)}</span>
      </div>
    </Link>
  );
}
