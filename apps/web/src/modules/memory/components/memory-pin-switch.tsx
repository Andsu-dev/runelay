import type { MemoryView } from "@runeley/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/form/switch";
import { toast } from "@/lib/toast";
import { memoryQuery, updateMemory } from "@/modules/memory/api/memories.api";
import { useMemoryCache } from "@/modules/memory/hooks/use-memory-cache";

interface MemoryPinSwitchProps {
  memory: MemoryView;
}

export function MemoryPinSwitch({ memory }: MemoryPinSwitchProps) {
  const queryClient = useQueryClient();
  const storeMemory = useMemoryCache();
  const detailKey = memoryQuery(memory.slug).queryKey;

  const pin = useMutation({
    mutationFn: (pinned: boolean) => updateMemory(memory.slug, { pinned }),
    onMutate: (pinned) => {
      const previous = queryClient.getQueryData(detailKey);
      if (previous) queryClient.setQueryData(detailKey, { ...previous, pinned });
      return previous;
    },
    onSuccess: (updated) => {
      storeMemory(updated);
      toast(updated.pinned ? "Fixada. Entra no contexto de todo agente." : "Não está mais fixada.");
    },
    onError: (error, _pinned, previous) => {
      if (previous) queryClient.setQueryData(detailKey, previous);
      toast(error.message, "error");
    },
  });

  return (
    <div className="flex min-h-11 items-center gap-3 rounded-lg bg-muted/50 px-3 sm:min-h-10">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[13px] font-medium">Fixada</span>
        <span className="text-[12px] text-muted-foreground">Entra no contexto de todo agente, sem busca.</span>
      </span>
      <Switch
        checked={memory.pinned}
        disabled={pin.isPending}
        label={memory.pinned ? "Desafixar" : "Fixar"}
        onCheckedChange={(next) => pin.mutate(next)}
      />
    </div>
  );
}
