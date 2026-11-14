import type { MemoryView } from "@runelay/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/action/button";
import { Dialog } from "@/components/ui/overlay/dialog";
import { toast } from "@/lib/toast";
import { deleteMemory, memoryQuery } from "@/modules/memory/api/memories.api";

interface DeleteMemoryDialogProps {
  memory: MemoryView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteMemoryDialog({ memory, open, onOpenChange }: DeleteMemoryDialogProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const citations =
    memory.backlinkCount === 0
      ? "Nenhuma outra memória cita esta."
      : `${memory.backlinkCount} ${memory.backlinkCount === 1 ? "memória cita" : "memórias citam"} esta e ficam com link quebrado.`;

  const remove = useMutation({
    mutationFn: () => deleteMemory(memory.slug),
    onSuccess: () => {
      onOpenChange(false);
      navigate({ to: "/memory" });
      queryClient.removeQueries({ queryKey: memoryQuery(memory.slug).queryKey });
      queryClient.invalidateQueries({ queryKey: ["memories"] });
      toast(`${memory.name} removida.`);
    },
    onError: (error) => toast(error.message, "error"),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Remover ${memory.name}?`}
      description={`Os agentes deixam de ler esta memória. ${citations}`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="glass" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" loading={remove.isPending} onClick={() => remove.mutate()}>
            Remover
          </Button>
        </div>
      }
    >
      <span className="sr-only">Confirmação de remoção</span>
    </Dialog>
  );
}
