export interface ToolCallRecord {
  organizationId: string;
  apiKeyId: string | null;
  source: string;
  tool: string;
  ok: boolean;
  durationMs: number;
}

export interface ActivityTotalsRow {
  calls: number;
  errors: number;
  errorRate: number;
  changePercent: number | null;
  averageMs: number | null;
}

export interface OnboardingRow {
  source: 0 | 1;
  api_key: 0 | 1;
  agent: 0 | 1;
  completed: number;
}
