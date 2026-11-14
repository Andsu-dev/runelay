export type SkillPullOutcome = "created" | "updated" | "unchanged" | "local" | "failed";

export interface SkillPullResult {
  slug: string;
  outcome: SkillPullOutcome;
  message?: string;
}
