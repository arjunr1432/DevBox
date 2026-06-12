const { app, BrowserWindow } = require('electron');
const path = require('path');

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

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
