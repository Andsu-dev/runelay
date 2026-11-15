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
  openAtLogin: boolean;
}

export interface RunelayDesktopBridge {
  listServers(): Promise<DesktopServerList>;
  addServer(input: { name?: string; url: string }): Promise<{ error: string | null; id: string | null }>;
  switchServer(id: string): Promise<{ error: string | null }>;
  renameServer(id: string, name: string): Promise<{ error: string | null }>;
  removeServer(id: string): Promise<{ error: string | null }>;
  getStartup?(): Promise<DesktopStartup>;
  setStartup?(enabled: boolean): Promise<{ error: string | null; openAtLogin: boolean }>;
}

declare global {
  interface Window {
    runelayDesktop?: RunelayDesktopBridge;
  }
}
