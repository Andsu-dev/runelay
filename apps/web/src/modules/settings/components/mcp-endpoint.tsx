import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CopyButton } from "@/components/ui/action/copy-button";
import { CommandBlock } from "@/components/ui/display/command-block";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { HOSTED_AGENTS_DOCS_URL, LOCAL_HOSTNAMES, MCP_PATH } from "@/modules/settings/constants/settings.constants";

interface McpEndpointProps {
  compact?: boolean;
  className?: string;
}

export function McpEndpoint({ compact, className }: McpEndpointProps) {
  const t = useT();
  const endpoint = `${window.location.origin}${MCP_PATH}`;
  const local = LOCAL_HOSTNAMES.includes(window.location.hostname);
  const label = t(local ? "settings.endpoint.labelLocal" : "settings.endpoint.label");

  return (
    <div className={cn("flex min-w-0 flex-col", compact ? "gap-0.5" : "gap-1.5", className)}>
      {compact ? (
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-[12px] text-muted-foreground">{label}</span>
          <code className="min-w-0 truncate font-mono text-[11px]">{endpoint}</code>
          <CopyButton value={endpoint} label={t("settings.endpoint.copy")} />
        </div>
      ) : (
        <>
          <span className="text-[13px] font-medium">{label}</span>
          <CommandBlock value={endpoint} label={t("settings.endpoint.copy")} />
        </>
      )}
      {local && (
        <p className="text-xs text-pretty text-muted-foreground">
          {t("settings.endpoint.hostedHint")}{" "}
          <a
            href={HOSTED_AGENTS_DOCS_URL}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-0.5 font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t("settings.endpoint.hostedLink")}
            <HugeiconsIcon
              icon={ArrowUpRight01Icon}
              size={12}
              strokeWidth={2}
              className="text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </a>
        </p>
      )}
    </div>
  );
}
