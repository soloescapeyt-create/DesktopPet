const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("romPet", {
  getState: () => ipcRenderer.invoke("state:get"),
  saveState: (state) => ipcRenderer.invoke("state:save", state),
  getNotes: () => ipcRenderer.invoke("notes:get"),
  addNote: (text) => ipcRenderer.invoke("notes:add", text),

  dragMove: (delta) => ipcRenderer.send("window:drag-move", delta),
  dragEnd: () => ipcRenderer.invoke("window:drag-end"),
  setAlwaysOnTop: (enabled) => ipcRenderer.invoke("window:set-always-on-top", enabled),
  setPanelMode: (isOpen) => ipcRenderer.invoke("window:set-panel-mode", isOpen),

  openWebsite: (url) => ipcRenderer.invoke("shell:open-website", url),
  chooseFolder: () => ipcRenderer.invoke("dialog:choose-folder"),
  openFolder: (folderPath) => ipcRenderer.invoke("shell:open-folder", folderPath),

  onFeedPet: (callback) => ipcRenderer.on("tray:feed-pet", callback),
  onOpenTaskPanel: (callback) => ipcRenderer.on("tray:open-task-panel", callback)
});
