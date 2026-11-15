import { Brain02Icon } from "@hugeicons/core-free-icons";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { LoadMoreSentinel } from "@/components/ui/data/load-more-sentinel";
import { EmptyState } from "@/components/ui/display/empty-state";
import { FadeIn } from "@/components/ui/display/fade-in";
import { Skeleton } from "@/components/ui/display/skeleton";
import { UI_SPRING } from "@/components/ui/display/spring";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { type MemoryListFilter, memoriesQuery } from "@/modules/memory/api/memories.api";
import { MemoryRow } from "./memory-row";

const PLACEHOLDERS = [0, 1, 2, 3, 4, 5];

interface MemoryListProps {
  filter: MemoryListFilter;
}

export function MemoryList({ filter }: MemoryListProps) {
  const t = useT();
  const { data, isPending, isPlaceholderData, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
    ...memoriesQuery(filter),
    placeholderData: keepPreviousData,
  });

  if (isPending) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true">
        {PLACEHOLDERS.map((item) => (
          <Skeleton key={item} className="h-16 rounded-xl bg-muted/60" />
        ))}
      </div>
    );
  }

  const memories = data?.pages.flatMap((page) => page.items) ?? [];

  if (memories.length === 0) {
    return (
      <EmptyState
        icon={Brain02Icon}
        title={filter.query ? t("memory.list.emptyQueryTitle", { query: filter.query }) : t("memory.list.emptyTitle")}
        description={filter.query ? t("memory.list.emptyQueryDescription") : t("memory.list.emptyDescription")}
      />
    );
  }

  return (
    <FadeIn className={cn("-mx-3 flex flex-col transition-opacity duration-200", isPlaceholderData && "opacity-60")}>
      <ul className="flex flex-col">
        <AnimatePresence initial={false}>
          {memories.map((memory) => (
            <motion.li
              key={memory.slug}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ ...UI_SPRING, mass: 0.7 }}
              className="overflow-hidden"
            >
              <MemoryRow memory={memory} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <LoadMoreSentinel active={Boolean(hasNextPage)} busy={isFetchingNextPage} onReach={() => fetchNextPage()} />
    </FadeIn>
  );
}
