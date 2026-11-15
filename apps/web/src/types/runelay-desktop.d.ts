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

export interface RunelayDesktopBridge {
  listServers(): Promise<DesktopServerList>;
  addServer(input: { name?: string; url: string }): Promise<{ error: string | null; id: string | null }>;
  switchServer(id: string): Promise<{ error: string | null }>;
  renameServer(id: string, name: string): Promise<{ error: string | null }>;
  removeServer(id: string): Promise<{ error: string | null }>;
}

declare global {
  interface Window {
    runelayDesktop?: RunelayDesktopBridge;
  }
}
