const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (filename, dataUrl) => ipcRenderer.send('save-file', { filename, dataUrl }),
});
