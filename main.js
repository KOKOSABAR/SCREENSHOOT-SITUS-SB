const { app, BrowserWindow, Menu } = require('electron');
Menu.setApplicationMenu(null);
const path = require('path');
const net = require('net');

let mainWindow;
let activePort = 30000; // Fallback starting port

// Helper to check and find a dynamically free, unused network port
function getFreePort(startingPort = 35000) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => {
      resolve(getFreePort(startingPort + 1));
    });
    server.listen(startingPort, () => {
      const { port } = server.address();
      server.close(() => {
        resolve(port);
      });
    });
  });
}

function startExpressServer(port) {
  try {
    // Inject the dynamically found free port to process environment
    process.env.PORT = String(port);
    require('./server.js');
    console.log(`[Electron] Integrated Express server loaded successfully on dynamic port: ${port}`);
  } catch (err) {
    console.error('[Electron] Failed to load integrated Express server:', err.message);
  }
}

function createWindow(port) {
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

  const url = `http://localhost:${port}`;

  // Load the local Express server URL
  // We wait 1.5 seconds for Express to boot up before loading
  setTimeout(() => {
    mainWindow.loadURL(url);
  }, 1500);

  // If Express fails to load or connection is refused, reload
  mainWindow.webContents.on('did-fail-load', () => {
    console.log(`Failed to load port ${port}, retrying in 1s...`);
    setTimeout(() => {
      mainWindow.loadURL(url);
    }, 1000);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Enforce Single Instance Lock to prevent duplicate windows or background process spawning
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Forcefully terminate immediately to prevent any blank window initialization
  console.log('[Electron] Second instance blocked. Exiting...');
  app.exit(0);
  process.exit(0);
} else {
  // Focus the primary window if a second instance launch is attempted
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    // Find a free port before starting window or Express
    activePort = await getFreePort(35000);
    startExpressServer(activePort);
    createWindow(activePort);

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow(activePort);
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
