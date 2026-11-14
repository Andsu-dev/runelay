import type { z } from "zod";
import type { activityRangeSchema, toolSearchSchema } from "./activity.schema";

export type ActivityRangeInput = z.infer<typeof activityRangeSchema>;
export type ToolSearchInput = z.infer<typeof toolSearchSchema>;

export interface DailyCallsView {
  day: string;
  calls: number;
  errors: number;
}

export interface RankedCountView {
  name: string;
  calls: number;
  share: number;
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
}

export interface ToolView {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
}
