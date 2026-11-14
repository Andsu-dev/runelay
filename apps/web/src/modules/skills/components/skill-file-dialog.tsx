import { Dialog } from "@/components/ui/overlay/dialog";
import { SkillFileContent } from "./skill-file-content";

interface SkillFileDialogProps {
  slug: string;
  path: string | null;
  onClose: () => void;
}

export function SkillFileDialog({ slug, path, onClose }: SkillFileDialogProps) {
  return (
    <Dialog
      open={path !== null}
      onOpenChange={(open) => !open && onClose()}
      title={path ?? ""}
      description="Arquivo da habilidade"
      contentClassName="sm:max-w-2xl"
    >
      {path && <SkillFileContent slug={slug} path={path} />}
    </Dialog>
  );
}
