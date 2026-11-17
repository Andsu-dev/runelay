import { CenterFocusIcon, MinusSignIcon, NeuralNetworkIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { IconAction } from "@/components/ui/action/icon-action";
import { EmptyState } from "@/components/ui/display/empty-state";
import { FadeIn } from "@/components/ui/display/fade-in";
import { Skeleton } from "@/components/ui/display/skeleton";
import { SearchField } from "@/components/ui/form/search-field";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { memoryGraphQuery } from "@/modules/memory/api/memories.api";
import { MEMORY_GRAPH_GLASS } from "@/modules/memory/constants/memory.constants";
import { useMemoryGraph } from "@/modules/memory/hooks/use-memory-graph";

interface MemoryGraphProps {
  title: string;
  query: string;
  onQueryChange: (query: string) => void;
  actions: ReactNode;
}

export function MemoryGraph({ title, query, onQueryChange, actions }: MemoryGraphProps) {
  const t = useT();
  const { data, isPending } = useQuery(memoryGraphQuery);
  const { attach, focus, fit, zoomIn, zoomOut } = useMemoryGraph(data, query);
  const ready = Boolean(data && data.nodes.length > 0);

  return (
    <div className="relative size-full">
      {isPending && <Skeleton className="absolute inset-0 rounded-none bg-muted/40" />}
      {!isPending && !ready && (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <EmptyState
            icon={NeuralNetworkIcon}
            title={t("memory.graph.emptyTitle")}
            description={t("memory.graph.emptyDescription")}
          />
        </div>
      )}
      {ready && (
        <FadeIn className="absolute inset-0">
          <div ref={attach} aria-label={t("memory.graph.label")} role="img" className="absolute inset-0" />
        </FadeIn>
      )}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between gap-3 p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className={cn(MEMORY_GRAPH_GLASS, "pointer-events-auto flex items-center gap-2 p-1 pl-3.5")}>
            <h1 className="text-[13px] font-semibold tracking-[-0.01em]">{title}</h1>
            <SearchField
              value={query}
              placeholder={t("memory.graph.search")}
              className="w-60 transition-[width] duration-300 ease-[cubic-bezier(0.2,0,0,1)] focus-within:w-80"
              onSearch={(value) => {
                onQueryChange(value);
                focus(value);
              }}
            />
          </div>
          <div className={cn(MEMORY_GRAPH_GLASS, "pointer-events-auto flex items-center gap-1 p-1")}>{actions}</div>
        </div>
        <div className="flex items-end justify-between gap-2">
          <p className="pointer-events-auto px-1 pb-1 text-xs text-muted-foreground/80 tabular-nums">
            {data && ready
              ? `${t.plural("memory.graph.nodes", data.nodes.length)} · ${t.plural("memory.graph.links", data.edges.length)}`
              : null}
          </p>
          {ready && (
            <div className={cn(MEMORY_GRAPH_GLASS, "pointer-events-auto flex items-center gap-0.5 p-1")}>
              <IconAction icon={CenterFocusIcon} label={t("memory.graph.fit")} side="top" onClick={fit} />
              <IconAction icon={MinusSignIcon} label={t("memory.graph.zoomOut")} side="top" onClick={zoomOut} />
              <IconAction icon={PlusSignIcon} label={t("memory.graph.zoomIn")} side="top" onClick={zoomIn} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
