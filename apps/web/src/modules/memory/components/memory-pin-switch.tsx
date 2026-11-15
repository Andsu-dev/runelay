import type { MemoryView } from "@runelay/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/form/switch";
import { translate, translateError, useT } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { memoryQuery, updateMemory } from "@/modules/memory/api/memories.api";
import { useMemoryCache } from "@/modules/memory/hooks/use-memory-cache";

interface MemoryPinSwitchProps {
  memory: MemoryView;
}

export function MemoryPinSwitch({ memory }: MemoryPinSwitchProps) {
  const t = useT();
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
      toast(translate(updated.pinned ? "memory.pin.pinned" : "memory.pin.unpinned"));
    },
    onError: (error, _pinned, previous) => {
      if (previous) queryClient.setQueryData(detailKey, previous);
      toast(translateError(error), "error");
    },
  });

  return (
    <div className="flex min-h-11 items-center gap-3 rounded-lg bg-muted/50 px-3 sm:min-h-10">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[13px] font-medium">{t("memory.pin.label")}</span>
        <span className="text-[12px] text-muted-foreground">{t("memory.pin.description")}</span>
      </span>
      <Switch
        checked={memory.pinned}
        disabled={pin.isPending}
        label={t(memory.pinned ? "memory.pin.unpin" : "memory.pin.pin")}
        onCheckedChange={(next) => pin.mutate(next)}
      />
    </div>
  );
}
