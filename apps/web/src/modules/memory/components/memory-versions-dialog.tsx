import { Dialog } from "@/components/ui/overlay/dialog";
import { MemoryVersionsPanel } from "./memory-versions-panel";

interface MemoryVersionsDialogProps {
  slug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestored: () => void;
}

export function MemoryVersionsDialog({ slug, open, onOpenChange, onRestored }: MemoryVersionsDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Versões"
      description="Restaurar troca nome, descrição e conteúdo pelos da versão escolhida. A atual vira uma versão."
      contentClassName="sm:max-w-3xl"
    >
      <MemoryVersionsPanel
        slug={slug}
        onRestored={() => {
          onRestored();
          onOpenChange(false);
        }}
      />
    </Dialog>
  );
}
