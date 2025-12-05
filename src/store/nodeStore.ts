import { create } from 'zustand';
import type {
  DaemonConfig,
  DaemonStatus,
  BlockchainInfo,
  NetworkInfo,
  PeerInfo,
  MemoryInfo,
} from '../types/rpc';

interface NodeState {
  // Daemon status
  daemonStatus: DaemonStatus;
  isStarting: boolean;
  isStopping: boolean;
  error: string | null;

  // Config
  config: DaemonConfig;

  // Blockchain info
  blockchainInfo: BlockchainInfo | null;
  networkInfo: NetworkInfo | null;
  peers: PeerInfo[];
  memoryInfo: MemoryInfo | null;

  // Actions
  setConfig: (config: Partial<DaemonConfig>) => void;
  startDaemon: () => Promise<void>;
  stopDaemon: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  refreshBlockchainInfo: () => Promise<void>;
  refreshPeers: () => Promise<void>;
  refreshMemoryInfo: () => Promise<void>;
  clearError: () => void;
}

// Get CPU count (will come from Electron, defaults to 4)
const getCpuCount = (): number => {
  if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
    return navigator.hardwareConcurrency;
  }
  return 4;
};

const defaultConfig: DaemonConfig = {
  network: 'mainnet',
  threads: Math.max(1, Math.floor(getCpuCount() / 2)), // Half of CPU cores as default
  rpcUser: 'junocash',
  rpcPassword: generateRandomPassword(),
};

function generateRandomPassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const useNodeStore = create<NodeState>((set, get) => ({
  // Initial state
  daemonStatus: { running: false },
  isStarting: false,
  isStopping: false,
  error: null,
  config: defaultConfig,
  blockchainInfo: null,
  networkInfo: null,
  peers: [],
  memoryInfo: null,

  // Actions
  setConfig: (newConfig) =>
    set((state) => ({
      config: { ...state.config, ...newConfig },
    })),

  startDaemon: async () => {
    const { config } = get();
    set({ isStarting: true, error: null });

    try {
      const result = await window.junocash.daemon.start(config);
      if (!result.success) {
        throw new Error(result.error || 'Failed to start daemon');
      }
      set({ isStarting: false, daemonStatus: { running: true } });

      // Refresh info after starting
      await get().refreshBlockchainInfo();
    } catch (error: any) {
      set({ isStarting: false, error: error.message });
      throw error;
    }
  },

  stopDaemon: async () => {
    set({ isStopping: true, error: null });

    try {
      const result = await window.junocash.daemon.stop();
      if (!result.success) {
        throw new Error(result.error || 'Failed to stop daemon');
      }
      set({
        isStopping: false,
        daemonStatus: { running: false },
        blockchainInfo: null,
        networkInfo: null,
        peers: [],
        memoryInfo: null,
      });
    } catch (error: any) {
      set({ isStopping: false, error: error.message });
      throw error;
    }
  },

  refreshStatus: async () => {
    try {
      const status = await window.junocash.daemon.status();
      set({ daemonStatus: status });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  refreshBlockchainInfo: async () => {
    try {
      const [blockchainInfo, networkInfo] = await Promise.all([
        window.junocash.rpc.call<BlockchainInfo>('getblockchaininfo'),
        window.junocash.rpc.call<NetworkInfo>('getnetworkinfo'),
      ]);
      console.log('Blockchain info updated:', {
        blocks: blockchainInfo.blocks,
        headers: blockchainInfo.headers,
        difficulty: blockchainInfo.difficulty,
        size_on_disk: blockchainInfo.size_on_disk
      });
      set({ blockchainInfo, networkInfo, error: null });
    } catch (error: any) {
      // Don't set error for expected failures when daemon is starting
      if (!error.message.includes('warming up')) {
        console.error('Failed to refresh blockchain info:', error);
        set({ error: error.message });
      }
    }
  },

  refreshPeers: async () => {
    try {
      const peers = await window.junocash.rpc.call<PeerInfo[]>('getpeerinfo');
      set({ peers });
    } catch (error: any) {
      // Silently wait during reindexing or warming up
      if (error.message?.includes('reindexing') ||
          error.message?.includes('warming up') ||
          error.message?.includes('not initialized')) {
        return;
      }
      console.error('Failed to refresh peers:', error);
    }
  },

  refreshMemoryInfo: async () => {
    try {
      const memoryInfo = await window.junocash.rpc.call<MemoryInfo>('getmemoryinfo');
      set({ memoryInfo });
    } catch (error: any) {
      console.error('Failed to refresh memory info:', error);
    }
  },

  clearError: () => set({ error: null }),
}));
