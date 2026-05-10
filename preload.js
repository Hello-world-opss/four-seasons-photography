const { contextBridge, ipcRenderer } = require('electron');

try {
  contextBridge.exposeInMainWorld('electronAPI', {
    // Data persistence
    getAppData: () => ipcRenderer.invoke('data:get'),
    saveAppData: (data) => ipcRenderer.invoke('data:save', data),

    // Image storage
    saveImage: (photoId, dataUrl) => ipcRenderer.invoke('image:save', photoId, dataUrl),
    getImageDataUrl: (photoId) => ipcRenderer.invoke('image:get', photoId),
    deleteImage: (photoId) => ipcRenderer.invoke('image:delete', photoId),

    // Native dialogs
    showSaveDialog: (defaultName) => ipcRenderer.invoke('dialog:save', defaultName),
    showOpenDialog: () => ipcRenderer.invoke('dialog:open'),
    showOpenImageDialog: () => ipcRenderer.invoke('dialog:openImage'),

    // Backup
    exportBackup: (data) => ipcRenderer.invoke('backup:export', data),
    importBackup: () => ipcRenderer.invoke('backup:import'),

    // App metadata
    getAppVersion: () => ipcRenderer.invoke('app:version'),
    getPicturesPath: () => ipcRenderer.invoke('app:picturesPath')
  });

  console.log('[Preload] electronAPI exposed successfully');
} catch (err) {
  console.error('[Preload] Failed to expose electronAPI:', err);
}
