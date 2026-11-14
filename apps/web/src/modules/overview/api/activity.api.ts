import type { ActivitySummaryView } from "@runeley/shared";
import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export const activitySummaryQuery = (days: number) =>
  queryOptions({
    queryKey: ["activity", "summary", days],
    queryFn: () => api.get<ActivitySummaryView>(`/activity/summary?days=${days}`),
  });
