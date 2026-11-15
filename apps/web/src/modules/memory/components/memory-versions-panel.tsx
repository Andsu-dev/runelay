import type { MemoryVersionView } from "@runelay/shared";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/action/button";
import { Skeleton } from "@/components/ui/display/skeleton";
import { translate, translateError, useT } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { memoryVersionsQuery, updateMemory } from "@/modules/memory/api/memories.api";
import { useMemoryCache } from "@/modules/memory/hooks/use-memory-cache";
import { MemoryVersionItem } from "./memory-version-item";

interface MemoryVersionsPanelProps {
  slug: string;
  onRestored: () => void;
}

export function MemoryVersionsPanel({ slug, onRestored }: MemoryVersionsPanelProps) {
  const t = useT();
  const storeMemory = useMemoryCache();
  const { data: versions, error } = useQuery(memoryVersionsQuery(slug));
  const [selected, setSelected] = useState<MemoryVersionView | null>(null);
  const current = selected ?? versions?.[0] ?? null;

  const restore = useMutation({
    mutationFn: (version: MemoryVersionView) =>
      updateMemory(slug, { name: version.name, description: version.description, body: version.body }),
    onSuccess: (memory) => {
      storeMemory(memory);
      toast(translate("memory.versions.restored"));
      onRestored();
    },
    onError: (failure) => toast(translateError(failure), "error"),
  });

  if (error) return <p className="text-[13px] text-destructive">{translateError(error)}</p>;

  if (!versions) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    );
  }

  if (versions.length === 0 || !current) {
    return <p className="text-[13px] text-muted-foreground">{t("memory.versions.empty")}</p>;
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <ul className="flex max-h-40 shrink-0 flex-col gap-0.5 overflow-y-auto sm:max-h-[55dvh] sm:w-52">
        {versions.map((version) => (
          <li key={version.id}>
            <MemoryVersionItem version={version} selected={version.id === current.id} onSelect={setSelected} />
          </li>
        ))}
      </ul>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
            className="flex min-w-0 flex-col gap-2"
          >
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold">{current.name}</span>
              {current.description && <span className="text-[12px] text-muted-foreground">{current.description}</span>}
            </div>
            <pre className="max-h-[45dvh] overflow-auto rounded-lg bg-muted/50 p-3 font-mono text-[12px] leading-relaxed break-words whitespace-pre-wrap">
              {current.body || t("memory.versions.noBody")}
            </pre>
          </motion.div>
        </AnimatePresence>
        <div className="flex justify-end">
          <Button
            loading={restore.isPending}
            loadingText={t("memory.versions.restoring")}
            onClick={() => restore.mutate(current)}
          >
            {t("memory.versions.restore")}
          </Button>
        </div>
      </div>
    </div>
  );
}
