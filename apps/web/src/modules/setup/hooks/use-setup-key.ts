import { useQuery } from "@tanstack/react-query";
import { apiKeySecretQuery, apiKeysQuery } from "@/modules/api-keys/api/api-keys.api";
import { useRecentKey } from "@/modules/api-keys/stores/recent-key.store";

export const useSetupKey = () => {
  const recentKey = useRecentKey();
  const { data: apiKeys } = useQuery(apiKeysQuery);
  const latest = apiKeys?.[0] ?? null;
  const { data: secret } = useQuery({
    ...apiKeySecretQuery(latest?.id ?? ""),
    enabled: !recentKey && Boolean(latest?.recoverable),
  });
  return { key: recentKey ?? secret?.key ?? null, latest };
};
