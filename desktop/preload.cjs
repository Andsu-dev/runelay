const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("runelayDesktop", {
  listServers: () => ipcRenderer.invoke("runelay:list-servers"),
  addServer: (input) => ipcRenderer.invoke("runelay:add-server", input),
  switchServer: (id) => ipcRenderer.invoke("runelay:switch-server", id),
  renameServer: (id, name) => ipcRenderer.invoke("runelay:rename-server", id, name),
  removeServer: (id) => ipcRenderer.invoke("runelay:remove-server", id),
});
