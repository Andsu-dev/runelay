export type DesktopServerKind = "local" | "remote";

export interface DesktopServer {
  id: string;
  name: string;
  kind: DesktopServerKind;
  url: string | null;
}

export interface DesktopServerList {
  active: string;
  servers: DesktopServer[];
}

export interface DesktopStartup {
  supported: boolean;
  local?: boolean;
  openAtLogin: boolean;
}

export type AgentNativeMemory = "off" | "on" | "manual" | "n/a" | "error";

export interface DesktopAgentReport {
  id: string;
  name: string;
  detected: boolean;
  mcpSupported: boolean;
  mcpRegistered: boolean;
  nativeMemory: AgentNativeMemory;
  message: string | null;
}

export interface DesktopDoctorCheck {
  kind: string;
  status: "ok" | "warn" | "info";
  label: string;
  details: string[];
  fix: string | null;
  paths: string[];
}

export type DesktopSetupStep = "detect" | "migrate" | "connect" | "pull" | "doctor";

export type DesktopSetupEvent =
  | { type: "step"; step: DesktopSetupStep; status: "running" | "done" | "failed"; message: string | null }
  | { type: "agents"; agents: DesktopAgentReport[] };

export interface DesktopSetupResult {
  error: string | null;
  code: "missing_key" | "cli_failed" | null;
  errorCode?: string | null;
  agents?: DesktopAgentReport[];
  checks?: DesktopDoctorCheck[];
  imported?: { sources: number; connected: number; memories: number; skills: number } | null;
  archived?: { path: string | null; moved: number; kept: string[] } | null;
  pendingLogins?: string[];
  reconnectUrl?: string | null;
  failed?: Exclude<DesktopSetupStep, "detect" | "doctor">[];
}

export interface DesktopDoctorResult {
  error: string | null;
  code: "missing_key" | null;
  errorCode?: string | null;
  agents: DesktopAgentReport[];
  checks: DesktopDoctorCheck[];
}

export interface RunelayDesktopBridge {
  listServers(): Promise<DesktopServerList>;
  addServer(input: { name?: string; url: string }): Promise<{ error: string | null; id: string | null }>;
  switchServer(id: string): Promise<{ error: string | null }>;
  renameServer(id: string, name: string): Promise<{ error: string | null }>;
  removeServer(id: string): Promise<{ error: string | null }>;
  getStartup?(): Promise<DesktopStartup>;
  setStartup?(enabled: boolean): Promise<{ error: string | null; openAtLogin: boolean }>;
  agentKeyStatus?(): Promise<{ ready: boolean }>;
  saveAgentKey?(apiKey: string): Promise<{ error: string | null }>;
  setupAgents?(onProgress: (event: DesktopSetupEvent) => void): Promise<DesktopSetupResult>;
  doctor?(): Promise<DesktopDoctorResult>;
  openPath?(path: string): Promise<{ error: string | null }>;
}

declare global {
  interface Window {
    runelayDesktop?: RunelayDesktopBridge;
  }
}
