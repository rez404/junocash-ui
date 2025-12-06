"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const DaemonManager_1 = require("./daemon/DaemonManager");
const RpcClient_1 = require("./rpc/RpcClient");
let mainWindow = null;
let daemonManager = null;
let rpcClient = null;
const isDev = process.env.NODE_ENV === 'development' || !electron_1.app.isPackaged;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
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
    }
    else {
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
    daemonManager = new DaemonManager_1.DaemonManager(binPath);
}
// IPC Handlers
// Daemon control
electron_1.ipcMain.handle('daemon:start', async (_event, config) => {
    try {
        if (!daemonManager)
            initDaemonManager();
        await daemonManager.start(config);
        // Initialize RPC client
        const port = config.network === 'mainnet' ? 8232 : 18232;
        rpcClient = new RpcClient_1.RpcClient({
            host: '127.0.0.1',
            port: config.rpcPort || port,
            username: config.rpcUser,
            password: config.rpcPassword,
        });
        return { success: true };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('daemon:stop', async () => {
    try {
        if (rpcClient) {
            await rpcClient.call('stop', []);
        }
        if (daemonManager) {
            await daemonManager.stop();
        }
        rpcClient = null;
        return { success: true };
    }
    catch (error) {
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('daemon:status', async () => {
    if (!daemonManager) {
        return { running: false };
    }
    return daemonManager.getStatus();
});
// RPC calls
electron_1.ipcMain.handle('rpc:call', async (_event, method, params = []) => {
    if (!rpcClient) {
        throw new Error('RPC client not initialized. Start daemon first.');
    }
    try {
        const result = await rpcClient.call(method, params);
        return result;
    }
    catch (error) {
        throw new Error(error.message);
    }
});
// Dialog for selecting data directory
electron_1.ipcMain.handle('dialog:selectDirectory', async () => {
    const result = await electron_1.dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory', 'createDirectory'],
    });
    return result.filePaths[0] || null;
});
// Dialog for selecting a file (for import)
electron_1.ipcMain.handle('dialog:selectFile', async () => {
    const result = await electron_1.dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'Wallet Files', extensions: ['txt', 'dat', 'json'] },
            { name: 'All Files', extensions: ['*'] },
        ],
    });
    return result.filePaths[0] || null;
});
// Get export directory
electron_1.ipcMain.handle('daemon:getExportDir', async () => {
    if (!daemonManager)
        return null;
    return daemonManager.getExportDir();
});
// Copy file to destination
electron_1.ipcMain.handle('fs:copyFile', async (_event, src, dest) => {
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
electron_1.ipcMain.handle('shell:openExternal', async (_event, url) => {
    await electron_1.shell.openExternal(url);
});
// App lifecycle
electron_1.app.whenReady().then(() => {
    // Set Content Security Policy
    electron_1.session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
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
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', async () => {
    // Stop daemon before quitting
    if (daemonManager) {
        try {
            await daemonManager.stop();
        }
        catch (e) {
            console.error('Error stopping daemon:', e);
        }
    }
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('before-quit', async () => {
    if (daemonManager) {
        try {
            await daemonManager.stop();
        }
        catch (e) {
            console.error('Error stopping daemon:', e);
        }
    }
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    electron_1.dialog.showErrorBox('Error', error.message);
});
