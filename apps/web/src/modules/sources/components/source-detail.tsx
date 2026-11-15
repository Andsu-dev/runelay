import { ArrowLeft02Icon, PencilEdit02Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { SourceView } from "@runelay/shared";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { IconAction } from "@/components/ui/action/icon-action";
import { formatDate } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { ConnectorIcon } from "@/modules/catalog/components/connector-icon";
import { KIND_LABEL, STATUS_LABEL } from "@/modules/sources/constants/source.constants";
import { useSourceActions } from "@/modules/sources/hooks/use-source-actions";
import { RenameSourceDialog } from "./rename-source-dialog";
import { SourceConnectButton } from "./source-connect-button";
import { SourceEditor } from "./source-editor";
import { SourceStatusDot } from "./source-status-dot";

interface SourceDetailProps {
  source: SourceView;
  oauthError?: string;
}

export function SourceDetail({ source, oauthError }: SourceDetailProps) {
  const t = useT();
  const { name, config, status, error, toolCount, enabled, connectedAt } = source;
  const { test } = useSourceActions(name);
  const [renaming, setRenaming] = useState(false);
  const loginError = status === "ok" ? undefined : oauthError;

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/connectors"
        search={{ tab: "installed" }}
        className="flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} size={16} strokeWidth={1.6} />
        {t("sources.back")}
      </Link>

      <header className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <SourceStatusDot status={status} enabled={enabled} />
            <ConnectorIcon name={name} icon={source.icon} />
            <h1 className="truncate text-lg font-semibold">{name}</h1>
            <IconAction icon={PencilEdit02Icon} label={t("sources.rename.action")} onClick={() => setRenaming(true)} />
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {t(KIND_LABEL[config.kind])}
            </span>
          </div>
          <p className="text-[13px] text-muted-foreground">
            {enabled ? t(STATUS_LABEL[status]) : t("sources.status.paused")} · {t.plural("sources.tools", toolCount)} ·{" "}
            {t("sources.loginOn", { date: formatDate(connectedAt) })}
          </p>
        </div>
        <IconAction
          icon={RefreshIcon}
          label={t("sources.test")}
          onClick={() => test.mutate()}
          spinning={test.isPending}
          disabled={test.isPending}
        />
        <SourceConnectButton source={source} />
      </header>

      {(loginError ?? error) && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-[13px] break-words text-destructive">
          {loginError ? t("sources.loginFailed", { error: loginError }) : error}
        </p>
      )}

      <SourceEditor key={source.updatedAt} source={source} />
      <RenameSourceDialog key={name} name={name} open={renaming} onOpenChange={setRenaming} />
    </div>
  );
}
