import { Activity01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import type { ApiKeyView } from "@runeley/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/action/button";
import { IconAction } from "@/components/ui/action/icon-action";
import { Dialog } from "@/components/ui/overlay/dialog";
import { formatDate } from "@/lib/format";
import { toast } from "@/lib/toast";
import { apiKeysQuery, deleteApiKey } from "@/modules/api-keys/api/api-keys.api";
import { KeyActivityDialog } from "./key-activity-dialog";

interface ApiKeyRowProps {
  apiKey: ApiKeyView;
}

export function ApiKeyRow({ apiKey }: ApiKeyRowProps) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const label = apiKey.name ?? "Sem nome";

  const revoke = useMutation({
    mutationFn: () => deleteApiKey(apiKey.id),
    onMutate: () => {
      const previous = queryClient.getQueryData(apiKeysQuery.queryKey);
      queryClient.setQueryData(apiKeysQuery.queryKey, (keys = []) => keys.filter((key) => key.id !== apiKey.id));
      return previous;
    },
    onSuccess: () => toast(`${label} revogada.`),
    onError: (error, _input, previous) => {
      queryClient.setQueryData(apiKeysQuery.queryKey, previous);
      toast(error.message, "error");
    },
  });

  return (
    <div className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-xs">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold">{label}</span>
        <span className="truncate text-xs text-muted-foreground">
          <code className="font-mono">{apiKey.start}…</code> · criada em {formatDate(apiKey.createdAt)} · último uso{" "}
          {formatDate(apiKey.lastRequest)}
        </span>
      </div>
      <IconAction icon={Activity01Icon} label="Atividade" onClick={() => setInspecting(true)} />
      <IconAction icon={Delete02Icon} label="Revogar" tone="destructive" onClick={() => setConfirming(true)} />
      <KeyActivityDialog keyId={apiKey.id} label={label} open={inspecting} onOpenChange={setInspecting} />
      <Dialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Revogar ${label}?`}
        description="O agente que usa essa chave perde acesso a todas as conexões na hora."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="glass" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirming(false);
                revoke.mutate();
              }}
            >
              Revogar
            </Button>
          </div>
        }
      >
        <span className="sr-only">Confirmação de revogação</span>
      </Dialog>
    </div>
  );
}
