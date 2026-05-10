const { app, BrowserWindow, ipcMain, dialog, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const dataManager = require('./data-manager');
const imageStore = require('./image-store');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: '春·夏·秋·冬 — 王仁强摄影',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Page load failed:', errorCode, errorDescription);
  });
}

function registerProtocol() {
  protocol.handle('local-img', (request) => {
    try {
      const url = request.url.replace('local-img:///', '').replace('local-img://', '');
      const filePath = decodeURIComponent(url);
      const normalizedPath = filePath.replace(/\\/g, '/');
      return net.fetch('file:///' + normalizedPath);
    } catch (err) {
      console.error('Protocol handler error:', err);
      return new Response('', { status: 500 });
    }
  });
}

function registerIpcHandlers() {
  ipcMain.handle('data:get', () => {
    console.log('[IPC] data:get called');
    return dataManager.loadData();
  });

  ipcMain.handle('data:save', (_event, data) => {
    dataManager.saveData(data);
    return true;
  });

  ipcMain.handle('image:save', (_event, photoId, dataUrl) => {
    try {
      const filePath = imageStore.saveImage(photoId, dataUrl);
      return { success: true, filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('image:get', (_event, photoId) => {
    return imageStore.getImageDataUrl(photoId);
  });

  ipcMain.handle('image:delete', (_event, photoId) => {
    imageStore.deleteImage(photoId);
    return true;
  });

  ipcMain.handle('dialog:save', async (_event, defaultName) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultName,
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });
    return result.canceled ? null : result.filePath;
  });

  ipcMain.handle('dialog:open', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
      properties: ['openFile']
    });
    return (result.canceled || result.filePaths.length === 0) ? null : result.filePaths[0];
  });

  ipcMain.handle('dialog:openImage', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      filters: [{ name: 'Image Files', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp'] }],
      properties: ['openFile']
    });
    return (result.canceled || result.filePaths.length === 0) ? null : result.filePaths[0];
  });

  ipcMain.handle('backup:export', async (_event, data) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: 'fourSeasons_backup_' + new Date().toISOString().slice(0, 10) + '.json',
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });
    if (result.canceled) return false;

    const exportData = JSON.parse(JSON.stringify(data));
    for (const album of exportData.albums || []) {
      for (const photo of album.photos || []) {
        if (photo.url && photo.url.includes('local-img://')) {
          const fp = imageStore.pathFromUrl(photo.url);
          if (fs.existsSync(fp)) {
            const buf = fs.readFileSync(fp);
            const ext = path.extname(fp).slice(1).toLowerCase();
            const mimeMap = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', webp: 'webp', bmp: 'bmp' };
            photo.url = 'data:image/' + (mimeMap[ext] || 'jpeg') + ';base64,' + buf.toString('base64');
          }
        }
      }
      if (album.cover && album.cover.includes('local-img://')) {
        const fp = imageStore.pathFromUrl(album.cover);
        if (fs.existsSync(fp)) {
          const buf = fs.readFileSync(fp);
          const ext = path.extname(fp).slice(1).toLowerCase();
          const mimeMap = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', webp: 'webp', bmp: 'bmp' };
          album.cover = 'data:image/' + (mimeMap[ext] || 'jpeg') + ';base64,' + buf.toString('base64');
        }
      }
    }
    for (const s of ['spring', 'summer', 'autumn', 'winter']) {
      if (exportData.spreadImages && exportData.spreadImages[s] && exportData.spreadImages[s].includes('local-img://')) {
        const fp = imageStore.pathFromUrl(exportData.spreadImages[s]);
        if (fs.existsSync(fp)) {
          const buf = fs.readFileSync(fp);
          const ext = path.extname(fp).slice(1).toLowerCase();
          const mimeMap = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', webp: 'webp', bmp: 'bmp' };
          exportData.spreadImages[s] = 'data:image/' + (mimeMap[ext] || 'jpeg') + ';base64,' + buf.toString('base64');
        }
      }
    }
    fs.writeFileSync(result.filePath, JSON.stringify(exportData, null, 2), 'utf-8');
    return true;
  });

  ipcMain.handle('backup:import', async () => {
    const openResult = await dialog.showOpenDialog(mainWindow, {
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
      properties: ['openFile']
    });
    if (openResult.canceled || openResult.filePaths.length === 0) return null;
    const filePath = openResult.filePaths[0];

    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    for (const album of data.albums || []) {
      for (const photo of album.photos || []) {
        if (photo.url && photo.url.startsWith('data:image/')) {
          photo.url = imageStore.saveImage(photo.id, photo.url);
        }
      }
      if (album.cover && album.cover.startsWith('data:image/')) {
        album.cover = imageStore.saveImage(album.id + '-cover', album.cover);
      }
    }
    for (const s of ['spring', 'summer', 'autumn', 'winter']) {
      if (data.spreadImages && data.spreadImages[s] && data.spreadImages[s].startsWith('data:image/')) {
        data.spreadImages[s] = imageStore.saveImage('spread-' + s, data.spreadImages[s]);
      }
    }
    dataManager.saveData(data);
    return data;
  });

  ipcMain.handle('app:version', () => app.getVersion());
  ipcMain.handle('app:picturesPath', () => imageStore.PHOTOS_DIR);
}

app.whenReady().then(() => {
  console.log('[Main] App ready');
  registerProtocol();
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
