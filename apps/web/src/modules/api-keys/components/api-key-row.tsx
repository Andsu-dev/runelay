import { Activity01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import type { ApiKeyView } from "@runelay/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { IconAction } from "@/components/ui/action/icon-action";
import { ConfirmPopover } from "@/components/ui/overlay/confirm-popover";
import { formatDate } from "@/lib/format";
import { translate, translateError, useT } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { apiKeysQuery, deleteApiKey } from "@/modules/api-keys/api/api-keys.api";
import { KeyActivityDialog } from "./key-activity-dialog";

interface ApiKeyRowProps {
  apiKey: ApiKeyView;
}

export function ApiKeyRow({ apiKey }: ApiKeyRowProps) {
  const t = useT();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const label = apiKey.name ?? t("apiKeys.unnamed");

  const revoke = useMutation({
    mutationFn: () => deleteApiKey(apiKey.id),
    onMutate: () => {
      const previous = queryClient.getQueryData(apiKeysQuery.queryKey);
      queryClient.setQueryData(apiKeysQuery.queryKey, (keys = []) => keys.filter((key) => key.id !== apiKey.id));
      return previous;
    },
    onSuccess: () => toast(translate("apiKeys.revoked", { name: label })),
    onError: (error, _input, previous) => {
      queryClient.setQueryData(apiKeysQuery.queryKey, previous);
      toast(translateError(error), "error");
    },
  });

  return (
    <div className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-xs">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold">{label}</span>
        <span className="truncate text-xs text-muted-foreground">
          <code className="font-mono">{apiKey.start}…</code> ·{" "}
          {t("apiKeys.meta", { created: formatDate(apiKey.createdAt), lastUsed: formatDate(apiKey.lastRequest) })}
        </span>
      </div>
      <IconAction icon={Activity01Icon} label={t("apiKeys.activity")} onClick={() => setInspecting(true)} />
      <ConfirmPopover
        open={confirming}
        onOpenChange={setConfirming}
        trigger={<IconAction icon={Delete02Icon} label={t("apiKeys.revoke")} tone="destructive" />}
        title={t("apiKeys.revokeTitle", { name: label })}
        description={t("apiKeys.revokeDescription")}
        confirmLabel={t("apiKeys.revoke")}
        onConfirm={() => revoke.mutate()}
      />
      <KeyActivityDialog keyId={apiKey.id} label={label} open={inspecting} onOpenChange={setInspecting} />
    </div>
  );
}
