const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("runelayChooser", {
  choose: (input) => ipcRenderer.invoke("chooser:choose", input),
  done: () => ipcRenderer.invoke("chooser:done"),
});
