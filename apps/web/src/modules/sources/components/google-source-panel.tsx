import type { GoogleConfig, SourceView } from "@runelay/shared";
import { useT } from "@/lib/i18n";
import { GOOGLE_SERVICE_LABEL } from "@/modules/sources/constants/source.constants";

interface GoogleSourcePanelProps {
  source: SourceView;
  config: GoogleConfig;
}

export function GoogleSourcePanel({ source, config }: GoogleSourcePanelProps) {
  const t = useT();
  const email = source.google?.email;

  return (
    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-3 rounded-xl bg-card p-4 text-[13px] sm:p-5">
      <dt className="text-muted-foreground">{t("sources.google.service")}</dt>
      <dd className="truncate font-medium">
        {config.services.map((service) => t(GOOGLE_SERVICE_LABEL[service])).join(", ")}
      </dd>
      <dt className="text-muted-foreground">{t("sources.google.account")}</dt>
      <dd className={email ? "truncate font-medium" : "text-muted-foreground"}>
        {email ?? t("sources.google.notConnected")}
      </dd>
    </dl>
  );
}
