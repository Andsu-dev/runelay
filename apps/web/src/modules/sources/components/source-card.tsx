import { Delete02Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import type { SourceView } from "@runelay/shared";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { IconAction } from "@/components/ui/action/icon-action";
import { Switch } from "@/components/ui/form/switch";
import { ConfirmPopover } from "@/components/ui/overlay/confirm-popover";
import { useT } from "@/lib/i18n";
import { ConnectorIcon } from "@/modules/catalog/components/connector-icon";
import { KIND_LABEL, STATUS_LABEL } from "@/modules/sources/constants/source.constants";
import { useSourceActions } from "@/modules/sources/hooks/use-source-actions";
import { isAgentLocal } from "@/modules/sources/utils/agent-local";
import { sourceTarget } from "@/modules/sources/utils/source-target";
import { GoogleSourceSummary } from "./google-source-summary";
import { SourceConnectButton } from "./source-connect-button";
import { SourceStatusDot } from "./source-status-dot";

interface SourceCardProps {
  source: SourceView;
}

export function SourceCard({ source }: SourceCardProps) {
  const t = useT();
  const { name, config, status, error, toolCount, enabled } = source;
  const { toggle, remove, test } = useSourceActions(name);
  const [confirming, setConfirming] = useState(false);
  const local = isAgentLocal(source);

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-card p-4 shadow-xs sm:p-5">
      <div className="flex items-center gap-3">
        <SourceStatusDot status={status} enabled={enabled} local={local} />
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
              {t(KIND_LABEL[config.kind])}
            </span>
          </div>
          <span className="truncate text-xs text-muted-foreground">
            {!enabled ? t("sources.status.paused") : local ? t("sources.status.agentLocal") : t(STATUS_LABEL[status])} ·{" "}
            {t.plural("sources.tools", toolCount)} ·{" "}
            {config.kind === "google" ? <GoogleSourceSummary source={source} config={config} /> : sourceTarget(config)}
          </span>
        </div>

        <SourceConnectButton source={source} className="hidden sm:inline-flex" />
        <IconAction
          icon={RefreshIcon}
          label={t("sources.test")}
          onClick={() => test.mutate()}
          spinning={test.isPending}
          disabled={test.isPending}
        />
        <ConfirmPopover
          open={confirming}
          onOpenChange={setConfirming}
          trigger={<IconAction icon={Delete02Icon} label={t("sources.remove")} tone="destructive" />}
          title={t("sources.removeTitle", { name })}
          description={t.plural("sources.removeDescription", toolCount)}
          confirmLabel={t("sources.remove")}
          onConfirm={() => remove.mutate()}
        />
        <Switch
          checked={enabled}
          disabled={toggle.isPending}
          label={enabled ? t("sources.pause", { name }) : t("sources.activate", { name })}
          onCheckedChange={(next) => toggle.mutate(next)}
        />
      </div>

      {local && enabled ? (
        <p className="text-xs text-pretty text-muted-foreground">{t("sources.agentLocalHint")}</p>
      ) : (
        error && enabled && <p className="text-xs break-words text-destructive">{error}</p>
      )}

      <SourceConnectButton source={source} className="sm:hidden" />
    </div>
  );
}
