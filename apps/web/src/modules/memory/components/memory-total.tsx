import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useT } from "@/lib/i18n";
import { type MemoryListFilter, memoriesQuery } from "@/modules/memory/api/memories.api";

interface MemoryTotalProps {
  filter: MemoryListFilter;
}

export function MemoryTotal({ filter }: MemoryTotalProps) {
  const t = useT();
  const { data } = useInfiniteQuery({ ...memoriesQuery(filter), placeholderData: keepPreviousData });
  const total = data?.pages[0]?.total;
  if (total === undefined) return t("memory.page.totalLoading");
  return t.plural("memory.page.total", total);
}
