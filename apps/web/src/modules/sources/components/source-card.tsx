import { Delete02Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import type { SourceView } from "@runelay/shared";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { IconAction } from "@/components/ui/action/icon-action";
import { Switch } from "@/components/ui/form/switch";
import { ConnectorIcon } from "@/modules/catalog/components/connector-icon";
import { KIND_LABEL, STATUS_LABEL } from "@/modules/sources/constants/source.constants";
import { useSourceActions } from "@/modules/sources/hooks/use-source-actions";
import { sourceTarget } from "@/modules/sources/utils/source-target";
import { DeleteSourceDialog } from "./delete-source-dialog";
import { SourceConnectButton } from "./source-connect-button";
import { SourceStatusDot } from "./source-status-dot";

interface SourceCardProps {
  source: SourceView;
}

export function SourceCard({ source }: SourceCardProps) {
  const { name, config, status, error, toolCount, enabled } = source;
  const { toggle, remove, test } = useSourceActions(name);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-card p-4 shadow-xs sm:p-5">
      <div className="flex items-center gap-3">
        <SourceStatusDot status={status} enabled={enabled} />
        <ConnectorIcon name={name} icon={source.icon} />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <Link
              to="/connectors/$name"
              params={{ name }}
              className="truncate text-sm font-semibold decoration-border underline-offset-4 hover:underline"
            >
              {name}
            </Link>
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {KIND_LABEL[config.kind]}
            </span>
          </div>
          <span className="truncate text-xs text-muted-foreground">
            {enabled ? STATUS_LABEL[status] : "Pausada"} · {toolCount} tools · {sourceTarget(config)}
          </span>
        </div>

        <SourceConnectButton source={source} className="hidden sm:inline-flex" />
        <IconAction
          icon={RefreshIcon}
          label="Testar conexão"
          onClick={() => test.mutate()}
          spinning={test.isPending}
          disabled={test.isPending}
        />
        <IconAction icon={Delete02Icon} label="Remover" tone="destructive" onClick={() => setConfirming(true)} />
        <Switch
          checked={enabled}
          disabled={toggle.isPending}
          label={enabled ? `Pausar ${name}` : `Ativar ${name}`}
          onCheckedChange={(next) => toggle.mutate(next)}
        />
      </div>

      {error && enabled && <p className="text-xs break-words text-destructive">{error}</p>}

      <SourceConnectButton source={source} className="sm:hidden" />

      <DeleteSourceDialog
        name={name}
        toolCount={toolCount}
        open={confirming}
        onOpenChange={setConfirming}
        onConfirm={() => remove.mutate()}
      />
    </div>
  );
}
