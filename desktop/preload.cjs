const { contextBridge, ipcRenderer } = require("electron");

const SETUP_PROGRESS = "runelay:setup-progress";

const setupAgents = (onProgress) => {
  const listener = (_event, payload) => {
    if (typeof onProgress === "function") onProgress(payload);
  };
  ipcRenderer.on(SETUP_PROGRESS, listener);
  return ipcRenderer.invoke("runelay:setup-agents").finally(() => ipcRenderer.removeListener(SETUP_PROGRESS, listener));
};

contextBridge.exposeInMainWorld("runelayDesktop", {
  listServers: () => ipcRenderer.invoke("runelay:list-servers"),
  addServer: (input) => ipcRenderer.invoke("runelay:add-server", input),
  switchServer: (id) => ipcRenderer.invoke("runelay:switch-server", id),
  renameServer: (id, name) => ipcRenderer.invoke("runelay:rename-server", id, name),
  removeServer: (id) => ipcRenderer.invoke("runelay:remove-server", id),
  getStartup: () => ipcRenderer.invoke("runelay:get-startup"),
  setStartup: (enabled) => ipcRenderer.invoke("runelay:set-startup", enabled),
  agentKeyStatus: () => ipcRenderer.invoke("runelay:agent-key-status"),
  saveAgentKey: (apiKey) => ipcRenderer.invoke("runelay:save-agent-key", apiKey),
  setupAgents,
  doctor: () => ipcRenderer.invoke("runelay:doctor"),
  getSkillsSyncStatus: () => ipcRenderer.invoke("runelay:skills-sync-status"),
  setSkillsSync: (enabled) => ipcRenderer.invoke("runelay:set-skills-sync", enabled),
  openPath: (path) => ipcRenderer.invoke("runelay:open-path", path),
});
