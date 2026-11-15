import { useQuery } from "@tanstack/react-query";
import { SegmentedControl } from "@/components/ui/display/segmented-control";
import { SearchField } from "@/components/ui/form/search-field";
import { useT } from "@/lib/i18n";
import type { ActivityCallsFilter } from "@/modules/activity/api/activity-calls.api";
import { apiKeysQuery } from "@/modules/api-keys/api/api-keys.api";
import { ConnectorIcon } from "@/modules/catalog/components/connector-icon";
import { sourcesQuery } from "@/modules/sources/api/sources.api";
import { ActivityTotal } from "./activity-total";
import { AgentChip } from "./agent-chip";
import { FilterMenu } from "./filter-menu";

type StatusValue = "all" | "ok" | "error";

interface ActivityFiltersProps {
  filter: ActivityCallsFilter;
  onChange: (next: Partial<ActivityCallsFilter>) => void;
}

const SEARCH_INPUT = "[&_input]:bg-muted/60 dark:[&_input]:bg-card";

export function ActivityFilters({ filter, onChange }: ActivityFiltersProps) {
  const t = useT();
  const { data: keys = [] } = useQuery(apiKeysQuery);
  const { data: sources = [] } = useQuery(sourcesQuery);

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
      <div className="flex flex-wrap items-center gap-2">
        <FilterMenu
          label={t("activity.filters.agent")}
          allLabel={t("activity.filters.allAgents")}
          value={filter.keyId}
          onChange={(keyId) => onChange({ keyId })}
          options={keys.map((key) => ({
            value: key.id,
            label: key.name ?? key.id,
            leading: <AgentChip name={key.name ?? ""} seed={key.id} hideName />,
          }))}
        />
        <FilterMenu
          label={t("activity.filters.connector")}
          allLabel={t("activity.filters.allConnectors")}
          value={filter.source}
          onChange={(source) => onChange({ source })}
          options={sources.map((source) => ({
            value: source.name,
            label: source.name,
            leading: <ConnectorIcon name={source.name} icon={source.icon} size="sm" />,
          }))}
        />
        <SegmentedControl<StatusValue>
          label={t("activity.filters.status")}
          value={filter.status ?? "all"}
          onChange={(status) => onChange({ status: status === "all" ? undefined : status })}
          options={[
            { value: "all", label: t("activity.filters.all") },
            { value: "ok", label: t("activity.filters.ok") },
            { value: "error", label: t("activity.filters.error") },
          ]}
        />
        <ActivityTotal filter={filter} />
      </div>
      <SearchField
        value={filter.query ?? ""}
        placeholder={t("activity.filters.search")}
        onSearch={(query) => onChange({ query: query || undefined })}
        className={`lg:ml-auto lg:max-w-64 ${SEARCH_INPUT}`}
      />
    </div>
  );
}
