export interface OnboardingStepView {
  id: "source" | "api_key" | "agent";
  label: string;
  done: boolean;
  to: string;
}

export interface OnboardingView {
  steps: OnboardingStepView[];
  completed: number;
  total: number;
}
