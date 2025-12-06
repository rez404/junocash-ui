"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods to renderer
electron_1.contextBridge.exposeInMainWorld('junocash', {
    // Daemon control
    daemon: {
        start: (config) => electron_1.ipcRenderer.invoke('daemon:start', config),
        stop: () => electron_1.ipcRenderer.invoke('daemon:stop'),
        status: () => electron_1.ipcRenderer.invoke('daemon:status'),
        getExportDir: () => electron_1.ipcRenderer.invoke('daemon:getExportDir'),
    },
    // RPC calls
    rpc: {
        call: (method, params = []) => electron_1.ipcRenderer.invoke('rpc:call', method, params),
    },
    // Dialog
    dialog: {
        selectDirectory: () => electron_1.ipcRenderer.invoke('dialog:selectDirectory'),
        selectFile: () => electron_1.ipcRenderer.invoke('dialog:selectFile'),
    },
    // File system operations
    fs: {
        copyFile: (src, dest) => electron_1.ipcRenderer.invoke('fs:copyFile', src, dest),
    },
    // Shell operations
    shell: {
        openExternal: (url) => electron_1.ipcRenderer.invoke('shell:openExternal', url),
    },
    // Event listeners
    on: (channel, callback) => {
        const subscription = (_event, ...args) => callback(...args);
        electron_1.ipcRenderer.on(channel, subscription);
        return () => {
            electron_1.ipcRenderer.removeListener(channel, subscription);
        };
    },
});
