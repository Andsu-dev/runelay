import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { formatNumber } from "@/lib/format";
import { type MemoryListFilter, memoriesQuery } from "@/modules/memory/api/memories.api";

interface MemoryTotalProps {
  filter: MemoryListFilter;
}

export function MemoryTotal({ filter }: MemoryTotalProps) {
  const { data } = useInfiniteQuery({ ...memoriesQuery(filter), placeholderData: keepPreviousData });
  const total = data?.pages[0]?.total;
  if (total === undefined) return "O que os agentes da organização sabem e lembram.";
  return `${formatNumber(total)} ${total === 1 ? "memória" : "memórias"}. Os agentes da organização leem e escrevem aqui.`;
}
