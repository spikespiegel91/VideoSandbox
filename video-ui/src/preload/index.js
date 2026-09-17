import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  chooseDirectory: () => ipcRenderer.invoke("choose-directory"),
  saveFile: (payload) => ipcRenderer.invoke("save-file", payload),
  openCSV: (delimeter) => ipcRenderer.invoke('open-csv', delimeter)
}

// dedicated video recording API for the renderer process
// e.g: window.video.start({directory, filename})
const video = {
    start: ({directory, filename}) => ipcRenderer.invoke("video:start", {directory, filename}),
    write: ({jobID, buffer}) => ipcRenderer.invoke("video:write", {jobID, buffer}),
    stop: (jobID) => ipcRenderer.invoke("video:stop", {jobID})
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('video', video)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
  window.video = video
}
