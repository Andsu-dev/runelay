import { Dialog } from "@/components/ui/overlay/dialog";
import { CommandPanel } from "./command-panel";

interface CommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandDialog({ open, onOpenChange }: CommandDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Buscar"
      description="Memórias, habilidades e tools"
      hideHeader
      hideClose
      contentClassName="gap-0 overflow-hidden p-0 pb-0 sm:top-[18%] sm:max-w-xl sm:translate-y-0 sm:pb-0"
      bodyClassName="m-0 p-0 pb-0 mb-0 mx-0 mt-0 gap-0 overflow-hidden"
    >
      <CommandPanel onNavigate={() => onOpenChange(false)} />
    </Dialog>
  );
}
