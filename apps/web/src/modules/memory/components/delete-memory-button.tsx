import { Delete02Icon } from "@hugeicons/core-free-icons";
import type { MemoryView } from "@runelay/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { IconAction } from "@/components/ui/action/icon-action";
import { ConfirmPopover } from "@/components/ui/overlay/confirm-popover";
import { translate, translateError, useT } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { deleteMemory, memoryQuery } from "@/modules/memory/api/memories.api";

interface DeleteMemoryButtonProps {
  memory: MemoryView;
}

export function DeleteMemoryButton({ memory }: DeleteMemoryButtonProps) {
  const t = useT();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const citations =
    memory.backlinkCount === 0
      ? t("memory.delete.noCitations")
      : t.plural("memory.delete.citations", memory.backlinkCount);

  const remove = useMutation({
    mutationFn: () => deleteMemory(memory.slug),
    onSuccess: () => {
      setOpen(false);
      navigate({ to: "/memory" });
      queryClient.removeQueries({ queryKey: memoryQuery(memory.slug).queryKey });
      queryClient.invalidateQueries({ queryKey: ["memories"] });
      toast(translate("memory.delete.removed", { name: memory.name }));
    },
    onError: (error) => toast(translateError(error), "error"),
  });

  return (
    <ConfirmPopover
      open={open}
      onOpenChange={setOpen}
      trigger={<IconAction icon={Delete02Icon} label={t("memory.delete.label")} tone="destructive" />}
      title={t("memory.delete.title", { name: memory.name })}
      description={t("memory.delete.description", { citations })}
      confirmLabel={t("memory.delete.label")}
      pending={remove.isPending}
      onConfirm={() => remove.mutateAsync()}
    />
  );
}
