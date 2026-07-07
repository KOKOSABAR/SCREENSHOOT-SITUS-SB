const { app, BrowserWindow, Menu } = require('electron');
Menu.setApplicationMenu(null);
const path = require('path');

let mainWindow;

function startExpressServer() {
  try {
    // Run Express server directly in the Electron thread
    process.env.PORT = '3000';
    require('./server.js');
    console.log('[Electron] Integrated Express server loaded successfully.');
  } catch (err) {
    console.error('[Electron] Failed to load integrated Express server:', err.message);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Auto Screenshot Dashboard',
    icon: path.join(__dirname, 'public', 'icon.png'), // Use newly generated modern icon
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Hide the default Electron menu bar (File, Edit, View, Window)
  mainWindow.setMenu(null);

  // Load the local Express server URL
  // We wait 1.5 seconds for Express to boot up before loading
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3000');
  }, 1500);

  // If Express fails to load or connection is refused, reload
  mainWindow.webContents.on('did-fail-load', () => {
    console.log('Failed to load, retrying in 1s...');
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:3000');
    }, 1000);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startExpressServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // Terminate Express server when desktop window closes
  if (serverProcess) {
    serverProcess.kill('SIGINT');
  }
  if (process.platform !== 'darwin') app.quit();
});
