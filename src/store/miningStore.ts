import { create } from 'zustand';
import type { MiningInfo } from '../types/rpc';

interface MiningState {
  // Mining status
  isEnabled: boolean;
  threads: number;
  miningInfo: MiningInfo | null;
  isLoading: boolean;
  isToggling: boolean;
  error: string | null;

  // Actions
  refreshMiningInfo: () => Promise<void>;
  setMining: (enabled: boolean, threads?: number) => Promise<void>;
  setThreads: (threads: number) => Promise<void>;
  clearError: () => void;
}

export const useMiningStore = create<MiningState>((set, get) => ({
  // Initial state
  isEnabled: false,
  threads: 1,
  miningInfo: null,
  isLoading: false,
  isToggling: false,
  error: null,

  // Actions
  refreshMiningInfo: async () => {
    set({ isLoading: true });
    try {
      const miningInfo = await window.junocash.rpc.call<MiningInfo>(
        'getmininginfo'
      );
      console.log('Mining info updated:', {
        networksolps: miningInfo.networksolps,
        localsolps: miningInfo.localsolps,
        generate: miningInfo.generate,
        genproclimit: miningInfo.genproclimit
      });
      set({
        miningInfo,
        isEnabled: miningInfo.generate,
        threads: miningInfo.genproclimit || 1,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Failed to refresh mining info:', error);

      // Don't show error if node is just not ready yet
      if (!error.message?.includes('RPC client not initialized') &&
          !error.message?.includes('warming up') &&
          !error.message?.includes('not initialized')) {
        set({ isLoading: false, error: error.message });
      } else {
        set({ isLoading: false });
      }
    }
  },

  setMining: async (enabled: boolean, threads?: number) => {
    const currentThreads = threads ?? get().threads;
    set({ isToggling: true, error: null });

    try {
      await window.junocash.rpc.call('setgenerate', [enabled, currentThreads]);
      set({
        isEnabled: enabled,
        threads: currentThreads,
        isToggling: false,
      });
      // Refresh mining info to get updated stats
      await get().refreshMiningInfo();
    } catch (error: any) {
      // Make error message user-friendly
      let errorMessage = error.message;
      if (error.message?.includes('RPC client not initialized')) {
        errorMessage = 'Please start the node first from the Node page before mining.';
      } else if (error.message?.includes('warming up')) {
        errorMessage = 'Node is starting up. Please wait a moment and try again.';
      } else if (error.message?.includes('not initialized')) {
        errorMessage = 'Node is not ready yet. Please wait for the node to finish starting.';
      }

      set({ isToggling: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  setThreads: async (threads: number) => {
    const { isEnabled } = get();
    set({ threads });

    // If mining is enabled, update with new thread count
    if (isEnabled) {
      await get().setMining(true, threads);
    }
  },

  clearError: () => set({ error: null }),
}));
