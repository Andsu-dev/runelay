import type { DoctorCheck } from "@/types/doctor.types";
import type { McpTargetDirs } from "@/types/mcp-target.types";

export type NativeMemoryState = "off" | "on" | "manual" | "n/a" | "error";

export interface AgentSpec {
  id: string;
  name: string;
  detect: string[];
  command?: string;
  mcpFile?: string;
  mcpFormat?: "json" | "toml";
}

export interface AgentReportInput {
  home: string;
  which: (command: string) => string | null;
  dirs?: McpTargetDirs;
}

export interface AgentReport {
  id: string;
  name: string;
  detected: boolean;
  mcpSupported: boolean;
  mcpRegistered: boolean;
  nativeMemory: NativeMemoryState;
  message: string | null;
  keyName: string | null;
}

export interface DoctorCheckReport {
  kind: string;
  status: DoctorCheck["status"];
  label: string;
  details: string[];
  fix: string | null;
  paths: string[];
}

export interface ConnectReport {
  command: "connect";
  ok: boolean;
  url: string;
  agents: AgentReport[];
}

export interface DoctorReport {
  command: "doctor";
  ok: boolean;
  warnings: number;
  agents: AgentReport[];
  checks: DoctorCheckReport[];
}

export interface MigrateReport {
  command: "migrate";
  ok: boolean;
  sent: boolean;
  organizationName: string;
  imported: { sources: number; connected: number; memories: number; skills: number };
  skipped: { sources: string[]; memories: string[]; skills: string[] };
  unchanged: { memories: string[]; skills: string[] };
  pendingLogins: string[];
  reconnectUrl: string | null;
  keychainPrompts: number;
  archived: { path: string | null; moved: number; kept: string[] };
  agents: AgentReport[];
  checks: DoctorCheckReport[];
}

export interface PushReport {
  command: "push";
  ok: boolean;
  imported: { memories: number; skills: number };
  unchanged: { memories: string[]; skills: string[] };
  skipped: { memories: string[]; skills: string[] };
}

export interface JsonFailure {
  ok: false;
  error: { code: string; message: string };
}

export interface SetupReport {
  command: "setup";
  ok: boolean;
  url: string;
  organizationName: string;
  signedIn: boolean;
  imported: MigrateReport["imported"];
  pendingLogins: string[];
  reconnectUrl: string | null;
  instructions: number;
  warnings: number;
  agents: AgentReport[];
  checks: DoctorCheckReport[];
  next: string;
}
