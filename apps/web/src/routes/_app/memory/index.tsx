import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/action/button";
import { PageHeader } from "@/components/ui/display/page-header";
import { SearchField } from "@/components/ui/form/search-field";
import type { MemoryListFilter } from "@/modules/memory/api/memories.api";
import { CreateMemoryDialog } from "@/modules/memory/components/create-memory-dialog";
import { MemoryHealthCard } from "@/modules/memory/components/memory-health-card";
import { MemoryList } from "@/modules/memory/components/memory-list";
import { MemoryTotal } from "@/modules/memory/components/memory-total";
import { MEMORY_FILTER_TITLE, MEMORY_FILTER_VALUES } from "@/modules/memory/constants/memory.constants";

export const Route = createFileRoute("/_app/memory/")({
  validateSearch: z.object({
    query: z.string().optional(),
    filter: z.enum(MEMORY_FILTER_VALUES).optional(),
  }),
  component: MemoryPage,
});

function MemoryPage() {
  const { query = "", filter = "all" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [creating, setCreating] = useState(false);
  const listFilter: MemoryListFilter = {
    query,
    type: filter === "all" || filter === "pinned" ? undefined : filter,
    pinned: filter === "pinned" || undefined,
  };

  return (
    <section className="flex flex-col gap-5">
      <PageHeader
        title={MEMORY_FILTER_TITLE[filter]}
        description={<MemoryTotal filter={listFilter} />}
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={1.8} />
            Nova memória
          </Button>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <div className="order-2 flex min-w-0 flex-col gap-4 lg:order-1">
          <div className="flex flex-col gap-3">
            <SearchField
              value={query}
              placeholder="Buscar memórias"
              onSearch={(value) =>
                navigate({ search: (prev) => ({ ...prev, query: value || undefined }), replace: true })
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
