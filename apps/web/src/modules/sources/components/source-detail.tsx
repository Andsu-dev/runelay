import { ArrowLeft02Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { SourceView } from "@runelay/shared";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/action/button";
import { IconAction } from "@/components/ui/action/icon-action";
import { formatDate } from "@/lib/format";
import { ConnectorIcon } from "@/modules/catalog/components/connector-icon";
import { KIND_LABEL, STATUS_LABEL } from "@/modules/sources/constants/source.constants";
import { useSourceActions } from "@/modules/sources/hooks/use-source-actions";
import { SourceEditor } from "./source-editor";
import { SourceStatusDot } from "./source-status-dot";

interface SourceDetailProps {
  source: SourceView;
  oauthError?: string;
}

export function SourceDetail({ source, oauthError }: SourceDetailProps) {
  const { name, config, status, error, toolCount, enabled, connectedAt } = source;
  const { test, login, startLogin } = useSourceActions(name);

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/connectors"
        search={{ tab: "installed" }}
        className="flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} size={16} strokeWidth={1.6} />
        Conectores
      </Link>

      <header className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <SourceStatusDot status={status} enabled={enabled} />
            <ConnectorIcon name={name} icon={source.icon} />
            <h1 className="truncate text-lg font-semibold">{name}</h1>
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {KIND_LABEL[config.kind]}
            </span>
          </div>
          <p className="text-[13px] text-muted-foreground">
            {enabled ? STATUS_LABEL[status] : "Pausada"} · {toolCount} tools · login em {formatDate(connectedAt)}
          </p>
        </div>
        <IconAction
          icon={RefreshIcon}
          label="Testar conexão"
          onClick={() => test.mutate()}
          spinning={test.isPending}
          disabled={test.isPending}
        />
        {config.kind === "mcp" && (
          <Button
            size="sm"
            variant={status === "needs_auth" ? "default" : "glass"}
            loading={login.isPending}
            onClick={startLogin}
          >
            {status === "needs_auth" ? "Fazer login" : "Reconectar"}
          </Button>
        )}
      </header>

      {(oauthError ?? error) && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-[13px] break-words text-destructive">
          {oauthError ? `O login falhou: ${oauthError}` : error}
        </p>
      )}

      <SourceEditor key={source.updatedAt} source={source} />
    </div>
  );
}
