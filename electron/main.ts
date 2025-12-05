import { app, BrowserWindow, ipcMain, dialog, session, shell } from 'electron';
import * as path from 'path';
import { DaemonManager } from './daemon/DaemonManager';
import { RpcClient } from './rpc/RpcClient';
import type { DaemonConfig } from './types/rpc';

let mainWindow: BrowserWindow | null = null;
let daemonManager: DaemonManager | null = null;
let rpcClient: RpcClient | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1400,
    minHeight: 900,
    backgroundColor: '#030712',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize daemon manager
function initDaemonManager() {
  const binPath = isDev
    ? path.join(__dirname, '../../bin')
    : path.join(process.resourcesPath, 'bin');

  daemonManager = new DaemonManager(binPath);
}

// IPC Handlers

// Daemon control
ipcMain.handle('daemon:start', async (_event, config: DaemonConfig) => {
  try {
    if (!daemonManager) initDaemonManager();
    await daemonManager!.start(config);

    // Initialize RPC client
    const port = config.network === 'mainnet' ? 8232 : 18232;
    rpcClient = new RpcClient({
      host: '127.0.0.1',
      port: config.rpcPort || port,
      username: config.rpcUser,
      password: config.rpcPassword,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('daemon:stop', async () => {
  try {
    if (rpcClient) {
      await rpcClient.call('stop', []);
    }
    if (daemonManager) {
      await daemonManager.stop();
    }
    rpcClient = null;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('daemon:status', async () => {
  if (!daemonManager) {
    return { running: false };
  }
  return daemonManager.getStatus();
});

// RPC calls
ipcMain.handle('rpc:call', async (_event, method: string, params: any[] = []) => {
  if (!rpcClient) {
    throw new Error('RPC client not initialized. Start daemon first.');
  }
  try {
    const result = await rpcClient.call(method, params);
    return result;
  } catch (error: any) {
    throw new Error(error.message);
  }
});

// Dialog for selecting data directory
ipcMain.handle('dialog:selectDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory', 'createDirectory'],
  });
  return result.filePaths[0] || null;
});

// Dialog for selecting a file (for import)
ipcMain.handle('dialog:selectFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [
      { name: 'Wallet Files', extensions: ['txt', 'dat', 'json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  return result.filePaths[0] || null;
});

// Get export directory
ipcMain.handle('daemon:getExportDir', async () => {
  if (!daemonManager) return null;
  return daemonManager.getExportDir();
});

// Copy file to destination
ipcMain.handle('fs:copyFile', async (_event, src: string, dest: string) => {
  const fs = require('fs');
  const path = require('path');

  // Ensure destination directory exists
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  fs.copyFileSync(src, dest);
  return true;
});

// Open external URL in system browser
ipcMain.handle('shell:openExternal', async (_event, url: string) => {
  await shell.openExternal(url);
});

// App lifecycle
app.whenReady().then(() => {
  // Set Content Security Policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          isDev
            ? "default-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' ws://localhost:* http://localhost:*; img-src 'self' data:; style-src 'self' 'unsafe-inline'"
            : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:"
        ]
      }
    });
  });

  initDaemonManager();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  // Stop daemon before quitting
  if (daemonManager) {
    try {
      await daemonManager.stop();
    } catch (e) {
      console.error('Error stopping daemon:', e);
    }
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  if (daemonManager) {
    try {
      await daemonManager.stop();
    } catch (e) {
      console.error('Error stopping daemon:', e);
    }
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  dialog.showErrorBox('Error', error.message);
});
