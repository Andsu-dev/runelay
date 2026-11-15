import { Dialog } from "@/components/ui/overlay/dialog";
import { useT } from "@/lib/i18n";
import { MemoryVersionsPanel } from "./memory-versions-panel";

interface MemoryVersionsDialogProps {
  slug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestored: () => void;
}

export function MemoryVersionsDialog({ slug, open, onOpenChange, onRestored }: MemoryVersionsDialogProps) {
  const t = useT();

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("memory.versions.title")}
      description={t("memory.versions.description")}
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
