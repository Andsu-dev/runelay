import { File01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { SkillFileRefView } from "@runelay/shared";
import { useState } from "react";
import { formatBytes } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { SkillFileDialog } from "./skill-file-dialog";

interface SkillFilesProps {
  slug: string;
  files: SkillFileRefView[];
}

export function SkillFiles({ slug, files }: SkillFilesProps) {
  const t = useT();
  const [openPath, setOpenPath] = useState<string | null>(null);

  if (files.length === 0) return null;

  return (
    <section className="flex flex-col gap-2 rounded-xl bg-card p-4 sm:p-5">
      <h2 className="text-[13px] font-semibold">{t("skills.files.title")}</h2>
      <ul className="-mx-2 flex flex-col">
        {files.map((file) => (
          <li key={file.path}>
            <button
              type="button"
              onClick={() => setOpenPath(file.path)}
              className="flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-left transition-colors duration-200 hover:bg-muted/60 sm:min-h-9"
            >
              <HugeiconsIcon icon={File01Icon} size={16} strokeWidth={1.6} className="shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate font-mono text-[12px]">{file.path}</span>
              <span className="shrink-0 text-[12px] text-muted-foreground tabular-nums">{formatBytes(file.size)}</span>
            </button>
          </li>
        ))}
      </ul>
      <SkillFileDialog slug={slug} path={openPath} onClose={() => setOpenPath(null)} />
    </section>
  );
}
