const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

function startExpressServer() {
  // Start server.js as a background process
  serverProcess = spawn('node', [path.join(__dirname, 'server.js')], {
    env: { ...process.env, PORT: '3000' }
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`[Express stdout]: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Express stderr]: ${data}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Website Auto-Screenshot Dashboard',
    icon: path.join(__dirname, 'public', 'favicon.ico'), // Fallback if icon exists
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load the local Express server URL
  // We wait 2 seconds for Express to boot up before loading
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3000');
  }, 2000);

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
