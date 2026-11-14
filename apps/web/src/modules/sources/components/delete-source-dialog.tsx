import { Button } from "@/components/ui/action/button";
import { Dialog } from "@/components/ui/overlay/dialog";

interface DeleteSourceDialogProps {
  name: string;
  toolCount?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteSourceDialog({ name, toolCount, open, onOpenChange, onConfirm }: DeleteSourceDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Remover ${name}?`}
      description={`${toolCount === undefined ? "As tools dela somem" : `${toolCount} tools somem`} de todos os agentes da organização. O login dessa conexão é apagado.`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="glass" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
          >
            Remover
          </Button>
        </div>
      }
    >
      <span className="sr-only">Confirmação de remoção</span>
    </Dialog>
  );
}
