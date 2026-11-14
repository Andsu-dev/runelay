import type { MemoryView } from "@runeley/shared";
import { useQueryClient } from "@tanstack/react-query";
import { memoryQuery } from "@/modules/memory/api/memories.api";

export const useMemoryCache = () => {
  const queryClient = useQueryClient();

  return (memory: MemoryView) => {
    queryClient.setQueryData(memoryQuery(memory.slug).queryKey, memory);
    queryClient.invalidateQueries({ queryKey: ["memories", "list"] });
    queryClient.invalidateQueries({ queryKey: ["memories", "health"] });
    queryClient.invalidateQueries({ queryKey: ["memories", "versions", memory.slug] });
  };
};
