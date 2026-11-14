import { Add01Icon } from "@hugeicons/core-free-icons";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { IconAction } from "@/components/ui/action/icon-action";
import { ListSkeleton } from "@/components/ui/display/list-skeleton";
import { RouteError } from "@/components/ui/display/route-error";
import { apiKeysQuery } from "@/modules/api-keys/api/api-keys.api";
import { ApiKeyList } from "@/modules/api-keys/components/api-key-list";
import { CreateApiKeyDialog } from "@/modules/api-keys/components/create-api-key-dialog";

export const Route = createFileRoute("/_app/api-keys")({
  loader: ({ context }) => context.queryClient.ensureQueryData(apiKeysQuery),
  pendingComponent: ListSkeleton,
  errorComponent: RouteError,
  component: ApiKeysPage,
});

function ApiKeysPage() {
  const { data: apiKeys } = useSuspenseQuery(apiKeysQuery);
  const [creating, setCreating] = useState(false);

  return (
    <section className="flex flex-col gap-5">
      <header className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h1 className="text-lg font-semibold">Chaves de API</h1>
          <p className="text-[13px] text-muted-foreground">Cada agente entra no runelay com a própria chave.</p>
        </div>
        <IconAction icon={Add01Icon} label="Nova chave" onClick={() => setCreating(true)} />
      </header>
      <ApiKeyList apiKeys={apiKeys} />
      <CreateApiKeyDialog open={creating} onOpenChange={setCreating} />
    </section>
  );
}
