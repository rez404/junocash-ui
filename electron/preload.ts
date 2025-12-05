import { contextBridge, ipcRenderer } from 'electron';
import type { DaemonConfig, DaemonStatus } from './types/rpc';

// Type definitions for the exposed API
export interface JunoCashAPI {
  daemon: {
    start: (config: DaemonConfig) => Promise<{ success: boolean; error?: string }>;
    stop: () => Promise<{ success: boolean; error?: string }>;
    status: () => Promise<DaemonStatus>;
    getExportDir: () => Promise<string | null>;
  };
  rpc: {
    call: <T = any>(method: string, params?: any[]) => Promise<T>;
  };
  dialog: {
    selectDirectory: () => Promise<string | null>;
    selectFile: () => Promise<string | null>;
  };
  fs: {
    copyFile: (src: string, dest: string) => Promise<boolean>;
  };
  shell: {
    openExternal: (url: string) => Promise<void>;
  };
  on: (channel: string, callback: (...args: any[]) => void) => () => void;
}

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('junocash', {
  // Daemon control
  daemon: {
    start: (config: DaemonConfig) => ipcRenderer.invoke('daemon:start', config),
    stop: () => ipcRenderer.invoke('daemon:stop'),
    status: () => ipcRenderer.invoke('daemon:status'),
    getExportDir: () => ipcRenderer.invoke('daemon:getExportDir'),
  },

  // RPC calls
  rpc: {
    call: <T = any>(method: string, params: any[] = []): Promise<T> =>
      ipcRenderer.invoke('rpc:call', method, params),
  },

  // Dialog
  dialog: {
    selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
    selectFile: () => ipcRenderer.invoke('dialog:selectFile'),
  },

  // File system operations
  fs: {
    copyFile: (src: string, dest: string) => ipcRenderer.invoke('fs:copyFile', src, dest),
  },

  // Shell operations
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  },

  // Event listeners
  on: (channel: string, callback: (...args: any[]) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, ...args: any[]) =>
      callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
} as JunoCashAPI);

// Declare the type on window for TypeScript
declare global {
  interface Window {
    junocash: JunoCashAPI;
  }
}
