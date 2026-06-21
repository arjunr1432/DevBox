const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset', // beautiful native macOS window controls overlay
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    title: 'Developer Utility Box',
  });

  // Load the built Vite index.html file
  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));

  // Open the DevTools. (optional, comment out for production)
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.on('save-file', async (event, { filename, dataUrl }) => {
    const { filePath } = await dialog.showSaveDialog({
      defaultPath: path.join(app.getPath('downloads'), filename),
      filters: [{ name: 'Images', extensions: ['png'] }]
    });

    if (filePath) {
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
      fs.writeFile(filePath, base64Data, 'base64', (err) => {
        if (err) {
          console.error("Error saving file:", err);
        }
      });
    }
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
