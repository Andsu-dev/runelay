import { Add01Icon, ListViewIcon, NeuralNetworkIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/action/button";
import { HideNamesToggle } from "@/components/ui/action/hide-names-toggle";
import { PageHeader } from "@/components/ui/display/page-header";
import { SegmentedControl } from "@/components/ui/display/segmented-control";
import { Skeleton } from "@/components/ui/display/skeleton";
import { SearchField } from "@/components/ui/form/search-field";
import { useT } from "@/lib/i18n";
import type { MemoryListFilter } from "@/modules/memory/api/memories.api";
import { CreateMemoryDialog } from "@/modules/memory/components/create-memory-dialog";
import { MemoryFilterPopover } from "@/modules/memory/components/memory-filter-popover";
import { MemoryHealthCard } from "@/modules/memory/components/memory-health-card";
import { MemoryList } from "@/modules/memory/components/memory-list";
import { MemoryTotal } from "@/modules/memory/components/memory-total";
import { MEMORY_FILTER_TITLE, MEMORY_FILTER_VALUES, MEMORY_VIEWS } from "@/modules/memory/constants/memory.constants";

const MemoryGraph = lazy(() =>
  import("@/modules/memory/components/memory-graph").then((module) => ({ default: module.MemoryGraph })),
);

export const Route = createFileRoute("/_app/memory/")({
  validateSearch: z.object({
    query: z.string().optional(),
    filter: z.enum(MEMORY_FILTER_VALUES).optional(),
    pinned: z.boolean().optional(),
    view: z.enum(MEMORY_VIEWS).optional(),
  }),
  component: MemoryPage,
});

function MemoryPage() {
  const t = useT();
  const { query = "", filter = "all", pinned, view = "list" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [creating, setCreating] = useState(false);
  const search = (value: string) =>
    navigate({ search: (prev) => ({ ...prev, query: value || undefined }), replace: true });
  const type = filter === "pinned" ? "all" : filter;
  const onlyPinned = filter === "pinned" || Boolean(pinned);
  const listFilter: MemoryListFilter = {
    query,
    type: type === "all" ? undefined : type,
    pinned: onlyPinned || undefined,
  };
  const title = t(MEMORY_FILTER_TITLE[type === "all" && onlyPinned ? "pinned" : type]);

  const actions = (
    <>
      <SegmentedControl
        label={t("memory.view.label")}
        value={view}
        onChange={(next) =>
          navigate({ search: (prev) => ({ ...prev, view: next === "list" ? undefined : next }), replace: true })
        }
        options={[
          { value: "list", label: t("memory.view.list"), icon: ListViewIcon },
          { value: "graph", label: t("memory.view.graph"), icon: NeuralNetworkIcon },
        ]}
      />
      <HideNamesToggle />
      <Button onClick={() => setCreating(true)} size={view === "graph" ? "default" : "sm"}>
        <HugeiconsIcon icon={Add01Icon} strokeWidth={1.8} />
        {t("memory.page.create")}
      </Button>
    </>
  );

  if (view === "graph") {
    return (
      <section
        data-full-bleed
        className="relative h-[calc(100dvh-2.75rem)] overflow-hidden max-lg:rounded-t-xl lg:h-[calc(100dvh-1rem)] lg:rounded-xl"
      >
        <Suspense fallback={<Skeleton className="absolute inset-0 rounded-none bg-muted/40" />}>
          <MemoryGraph title={title} query={query} onQueryChange={search} actions={actions} />
        </Suspense>
        <CreateMemoryDialog open={creating} onOpenChange={setCreating} />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-5">
      <PageHeader title={title} description={<MemoryTotal filter={listFilter} />} actions={actions} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <div className="order-2 flex min-w-0 flex-col gap-4 lg:order-1">
          <div className="flex items-center gap-2">
            <SearchField
              value={query}
              placeholder={t("memory.page.search")}
              onSearch={search}
              className="min-w-0 flex-1"
            />
            <MemoryFilterPopover
              type={type}
              pinned={onlyPinned}
              onChange={(nextType, nextPinned) =>
                navigate({
                  search: (prev) => ({
                    ...prev,
                    filter: nextType === "all" ? undefined : nextType,
                    pinned: nextPinned || undefined,
                  }),
                  replace: true,
                })
              }
            />
          </div>
          <MemoryList filter={listFilter} />
        </div>
        <aside className="order-1 lg:sticky lg:top-8 lg:order-2">
          <MemoryHealthCard />
        </aside>
      </div>
      <CreateMemoryDialog open={creating} onOpenChange={setCreating} />
    </section>
  );
}
