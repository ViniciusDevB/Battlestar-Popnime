const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateAvailable:  (cb) => ipcRenderer.on('update-available',  (_e, info)     => cb(info)),
  onDownloadProgress: (cb) => ipcRenderer.on('download-progress', (_e, progress) => cb(progress)),
  onUpdateDownloaded: (cb) => ipcRenderer.on('update-downloaded', () => cb()),
  installUpdate: () => ipcRenderer.send('install-update'),
});
