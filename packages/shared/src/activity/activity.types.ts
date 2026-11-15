import type { z } from "zod";
import type { activityCallsSchema, activityRangeSchema, toolSearchSchema } from "./activity.schema";

export type ActivityRangeInput = z.infer<typeof activityRangeSchema>;
export type ToolSearchInput = z.infer<typeof toolSearchSchema>;
export type ActivityCallsInput = z.infer<typeof activityCallsSchema>;

export interface ActivityCallView {
  id: number;
  source: string;
  tool: string;
  ok: boolean;
  durationMs: number;
  createdAt: string;
  keyId: string | null;
  keyName: string | null;
}

export interface DailyCallsView {
  day: string;
  calls: number;
  context: number;
  errors: number;
}

export interface RankedCountView {
  name: string;
  calls: number;
  share: number;
}

export interface RecentUsageView {
  name: string;
  calls: number;
  lastUsedAt: string;
}

export interface ActivitySummaryView {
  days: number;
  calls: number;
  errors: number;
  errorRate: number;
  changePercent: number | null;
  averageMs: number | null;
  daily: DailyCallsView[];
  bySource: RankedCountView[];
  topTools: RankedCountView[];
  byKind: RankedCountView[];
  recentSkills: RecentUsageView[];
  recentMemories: RecentUsageView[];
}

export interface ToolView {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
}
