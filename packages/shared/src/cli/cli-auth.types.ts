import type { z } from "zod";
import type { approveCliAuthSchema, startCliAuthSchema } from "./cli-auth.schema";

export type StartCliAuthInput = z.infer<typeof startCliAuthSchema>;
export type ApproveCliAuthInput = z.infer<typeof approveCliAuthSchema>;

export interface CliAuthStartView {
  code: string;
  pollToken: string;
  verificationUrl: string;
  expiresAt: string;
  intervalSeconds: number;
}

export type CliAuthStatus = "pending" | "approved" | "expired";

export interface CliAuthPollView {
  status: CliAuthStatus;
  apiKey: string | null;
  organizationName: string | null;
}

export interface CliAuthRequestView {
  code: string;
  device: string;
  expiresAt: string;
}

export interface CliStatusView {
  organizationName: string;
  sources: number;
  memories: number;
  skills: number;
}
