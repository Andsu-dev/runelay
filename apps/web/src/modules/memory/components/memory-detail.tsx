import { ArrowLeft02Icon, HistoryIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { MemoryView } from "@runelay/shared";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { IconAction } from "@/components/ui/action/icon-action";
import { formatDate } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { DeleteMemoryButton } from "./delete-memory-button";
import { MemoryEditor } from "./memory-editor";
import { MemoryLinks } from "./memory-links";
import { MemoryTypePill } from "./memory-type-pill";
import { MemoryVersionsDialog } from "./memory-versions-dialog";

interface MemoryDetailProps {
  memory: MemoryView;
}

export function MemoryDetail({ memory }: MemoryDetailProps) {
  const t = useT();
  const [revision, setRevision] = useState(0);
  const [showingVersions, setShowingVersions] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/memory"
        className="flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} size={16} strokeWidth={1.6} />
        {t("memory.detail.back")}
      </Link>

      <header className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-semibold">{memory.name}</h1>
            <MemoryTypePill type={memory.type} />
          </div>
          <p className="text-[12px] text-muted-foreground">
            <span className="font-mono">[[{memory.slug}]]</span> ·{" "}
            {t("memory.detail.updatedAt", { date: formatDate(memory.updatedAt) })}
          </p>
        </div>
        <IconAction icon={HistoryIcon} label={t("memory.detail.versions")} onClick={() => setShowingVersions(true)} />
        <DeleteMemoryButton memory={memory} />
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
        <MemoryEditor key={`${memory.slug}:${revision}`} memory={memory} />
        <MemoryLinks memory={memory} />
      </div>

      <MemoryVersionsDialog
        slug={memory.slug}
        open={showingVersions}
        onOpenChange={setShowingVersions}
        onRestored={() => setRevision(revision + 1)}
      />
    </div>
  );
}
