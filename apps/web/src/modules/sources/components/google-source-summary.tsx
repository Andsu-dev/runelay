import type { GoogleConfig, SourceView } from "@runelay/shared";
import { useT } from "@/lib/i18n";
import { GOOGLE_SERVICE_LABEL } from "@/modules/sources/constants/source.constants";

interface GoogleSourceSummaryProps {
  source: SourceView;
  config: GoogleConfig;
}

export function GoogleSourceSummary({ source, config }: GoogleSourceSummaryProps) {
  const t = useT();
  const services = config.services
    .flatMap((service) => (GOOGLE_SERVICE_LABEL[service] ? [t(GOOGLE_SERVICE_LABEL[service])] : []))
    .join(", ");
  return source.google?.email ? `${services} · ${source.google.email}` : services;
}
