import { create } from 'zustand';
import type { TotalBalance, Transaction, OperationStatus } from '../types/rpc';

interface WalletState {
  // Balance
  balance: TotalBalance | null;
  isLoadingBalance: boolean;

  // Addresses
  transparentAddresses: string[];
  shieldedAddresses: string[];
  isLoadingAddresses: boolean;

  // Transactions
  transactions: Transaction[];
  isLoadingTransactions: boolean;

  // Send operation
  pendingOperations: OperationStatus[];
  isSending: boolean;
  sendError: string | null;

  // Actions
  refreshBalance: () => Promise<void>;
  refreshAddresses: () => Promise<void>;
  refreshTransactions: (count?: number) => Promise<void>;
  createTransparentAddress: () => Promise<string>;
  createShieldedAddress: () => Promise<string>;
  sendToAddress: (address: string, amount: number) => Promise<string>;
  sendShielded: (
    from: string,
    to: Array<{ address: string; amount: number; memo?: string }>,
    fee?: number
  ) => Promise<string>;
  checkPendingOperations: () => Promise<void>;
  clearSendError: () => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  // Initial state
  balance: null,
  isLoadingBalance: false,
  transparentAddresses: [],
  shieldedAddresses: [],
  isLoadingAddresses: false,
  transactions: [],
  isLoadingTransactions: false,
  pendingOperations: [],
  isSending: false,
  sendError: null,

  // Actions
  refreshBalance: async () => {
    set({ isLoadingBalance: true });
    try {
      const balance = await window.junocash.rpc.call<TotalBalance>(
        'z_gettotalbalance',
        [1]
      );
      set({ balance, isLoadingBalance: false });
    } catch (error: any) {
      // Silently wait during reindexing or warming up
      if (error.message?.includes('reindexing') ||
          error.message?.includes('warming up') ||
          error.message?.includes('not initialized')) {
        set({ isLoadingBalance: false });
        return;
      }
      console.error('Failed to refresh balance:', error);
      set({ isLoadingBalance: false });
    }
  },

  refreshAddresses: async () => {
    set({ isLoadingAddresses: true });

    try {
      // Get transparent addresses - try multiple methods
      let tAddresses: string[] = [];

      // Method 1: listaddresses (new API)
      try {
        const listResult = await window.junocash.rpc.call<any>('listaddresses');
        console.log('listaddresses raw result:', listResult);
        if (Array.isArray(listResult)) {
          // Old format: direct string array
          if (typeof listResult[0] === 'string') {
            tAddresses = listResult;
          }
          // New format: objects
          else {
            for (const item of listResult) {
              // Transparent addresses for source === 'legacy_random' or 'imported'
              if (item.transparent?.addresses && Array.isArray(item.transparent.addresses)) {
                tAddresses.push(...item.transparent.addresses);
              }
              // Another format
              if (item.addresses && Array.isArray(item.addresses)) {
                for (const addr of item.addresses) {
                  if (typeof addr === 'string') {
                    tAddresses.push(addr);
                  } else if (addr.address) {
                    tAddresses.push(addr.address);
                  }
                }
              }
            }
          }
        }
      } catch (e: any) {
        // Silently skip RPC not ready errors
        if (e.message?.includes('not initialized')) {
          console.log('RPC not ready, skipping listaddresses');
        } else {
          console.log('listaddresses failed:', e);
        }
      }

      // Method 2: listreceivedbyaddress (lists all used addresses)
      if (tAddresses.length === 0) {
        try {
          const received = await window.junocash.rpc.call<any[]>('listreceivedbyaddress', [0, true]);
          if (Array.isArray(received)) {
            tAddresses = received.map(r => r.address).filter(Boolean);
          }
        } catch (e) {
          console.log('listreceivedbyaddress failed');
        }
      }

      // Get shielded addresses - try new API first, then old
      let zAddresses: string[] = [];

      // Method 1: z_listaccounts (new API)
      try {
        const accounts = await window.junocash.rpc.call<any[]>('z_listaccounts');
        if (Array.isArray(accounts)) {
          for (const acc of accounts) {
            if (acc.addresses) {
              for (const addrInfo of acc.addresses) {
                const addr = addrInfo.ua || addrInfo.address;
                if (addr) {
                  zAddresses.push(addr);
                }
              }
            }
          }
        }
      } catch (e) {
        console.log('z_listaccounts failed, trying z_listaddresses...');
      }

      // Method 2: z_listaddresses (old API)
      if (zAddresses.length === 0) {
        try {
          const zAddrsRaw = await window.junocash.rpc.call<any>('z_listaddresses');
          if (Array.isArray(zAddrsRaw)) {
            zAddresses = zAddrsRaw.filter((addr: any) => typeof addr === 'string');
          }
        } catch (e) {
          console.log('z_listaddresses failed');
        }
      }

      console.log('Loaded addresses:', { transparent: tAddresses, shielded: zAddresses });

      set({
        transparentAddresses: tAddresses,
        shieldedAddresses: zAddresses,
        isLoadingAddresses: false,
      });
    } catch (error: any) {
      // Silently wait during reindexing or warming up
      if (error.message?.includes('reindexing') ||
          error.message?.includes('warming up') ||
          error.message?.includes('not initialized')) {
        set({ isLoadingAddresses: false });
        return;
      }
      console.error('Failed to refresh addresses:', error);
      set({ isLoadingAddresses: false });
    }
  },

  refreshTransactions: async (count = 20) => {
    set({ isLoadingTransactions: true });
    try {
      const transactions = await window.junocash.rpc.call<Transaction[]>(
        'listtransactions',
        ['*', count, 0]
      );
      // Sort by time descending
      transactions.sort((a: Transaction, b: Transaction) => b.time - a.time);
      set({ transactions, isLoadingTransactions: false });
    } catch (error: any) {
      // Silently wait during reindexing or warming up
      if (error.message?.includes('reindexing') ||
          error.message?.includes('warming up') ||
          error.message?.includes('not initialized')) {
        set({ isLoadingTransactions: false });
        return;
      }
      console.error('Failed to refresh transactions:', error);
      set({ isLoadingTransactions: false });
    }
  },

  createTransparentAddress: async () => {
    try {
      const address = await window.junocash.rpc.call<string>('getnewaddress');
      await get().refreshAddresses();
      return address;
    } catch (error: any) {
      console.error('Failed to create transparent address:', error);
      // Check for recovery phrase error
      if (error.message?.includes('recovery phrase') || error.message?.includes('wallet-tool')) {
        throw new Error('Please restart the node. Go to Node page → Stop Node → Start Node. The wallet backup requirement will be disabled on restart.');
      }
      throw new Error('Failed to create transparent address: ' + error.message);
    }
  },

  createShieldedAddress: async () => {
    try {
      console.log('Creating shielded address...');

      // First check existing accounts and addresses
      let accounts: any[] = [];
      try {
        accounts = await window.junocash.rpc.call<any[]>('z_listaccounts');
        console.log('Existing accounts:', accounts);
      } catch (e: any) {
        console.log('z_listaccounts failed:', e.message);
        accounts = [];
      }

      // If account already has an address, return it
      if (accounts && accounts.length > 0 && accounts[0].addresses?.length > 0) {
        const existingAddr = accounts[0].addresses[0];
        const address = existingAddr.ua || existingAddr.address;
        console.log('Using existing address:', address);
        await get().refreshAddresses();
        return address;
      }

      // Try to create new account if it doesn't exist or has no address
      let accountId: number;

      if (!accounts || accounts.length === 0) {
        console.log('No accounts found, creating new account...');
        try {
          const newAccount = await window.junocash.rpc.call<{ account: number }>('z_getnewaccount');
          console.log('New account created:', newAccount);
          accountId = newAccount.account;
        } catch (error: any) {
          if (error.message.includes('recovery phrase') || error.message.includes('wallet-tool')) {
            throw new Error('Please restart the node. Go to Node page → Stop Node → Start Node. The wallet backup requirement will be disabled on restart.');
          }
          throw error;
        }
      } else {
        accountId = accounts[0].account ?? 0;
        console.log('Using existing account:', accountId);
      }

      // Get new address
      try {
        console.log('Getting new address for account:', accountId);
        const result = await window.junocash.rpc.call<{ address: string }>(
          'z_getaddressforaccount',
          [accountId, ['sapling']]
        );
        console.log('New address:', result);
        await get().refreshAddresses();
        return result.address;
      } catch (error: any) {
        // If recovery phrase not confirmed, provide helpful error message
        if (error.message.includes('recovery phrase') || error.message.includes('wallet-tool')) {
          // Check for existing addresses one more time
          const updatedAccounts = await window.junocash.rpc.call<any[]>('z_listaccounts').catch(() => []);
          if (updatedAccounts && updatedAccounts[0]?.addresses?.length > 0) {
            const addr = updatedAccounts[0].addresses[0];
            const existingAddress = addr.ua || addr.address;
            console.log('Returning existing address due to recovery phrase requirement:', existingAddress);
            await get().refreshAddresses();
            return existingAddress;
          }
          throw new Error('Please restart the node. Go to Node page → Stop Node → Start Node. The wallet backup requirement will be disabled on restart.');
        }
        throw error;
      }
    } catch (error: any) {
      console.error('Failed to create shielded address:', error);
      throw error;
    }
  },

  sendToAddress: async (address: string, amount: number) => {
    set({ isSending: true, sendError: null });
    try {
      const txid = await window.junocash.rpc.call<string>('sendtoaddress', [
        address,
        amount,
      ]);
      set({ isSending: false });
      await get().refreshBalance();
      await get().refreshTransactions();
      return txid;
    } catch (error: any) {
      set({ isSending: false, sendError: error.message });
      throw error;
    }
  },

  sendShielded: async (from, to, fee = 0.0001) => {
    set({ isSending: true, sendError: null });
    try {
      // Start the operation
      const opid = await window.junocash.rpc.call<string>('z_sendmany', [
        from,
        to,
        1,
        fee,
      ]);

      // Poll for completion
      const txid = await pollOperation(opid);

      set({ isSending: false });
      await get().refreshBalance();
      await get().refreshTransactions();
      return txid;
    } catch (error: any) {
      set({ isSending: false, sendError: error.message });
      throw error;
    }
  },

  checkPendingOperations: async () => {
    try {
      const opids = await window.junocash.rpc.call<string[]>(
        'z_listoperationids'
      );
      if (opids.length > 0) {
        const statuses = await window.junocash.rpc.call<OperationStatus[]>(
          'z_getoperationstatus',
          [opids]
        );
        set({ pendingOperations: statuses });
      } else {
        set({ pendingOperations: [] });
      }
    } catch (error: any) {
      console.error('Failed to check pending operations:', error);
    }
  },

  clearSendError: () => set({ sendError: null }),
}));

// Helper function to poll operation status
async function pollOperation(
  opid: string,
  maxWaitMs: number = 300000,
  intervalMs: number = 1000
): Promise<string> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const statuses = await window.junocash.rpc.call<OperationStatus[]>(
      'z_getoperationstatus',
      [[opid]]
    );

    if (statuses.length === 0) {
      throw new Error('Operation not found');
    }

    const status = statuses[0];

    switch (status.status) {
      case 'success':
        // Get result and return txid
        const results = await window.junocash.rpc.call<OperationStatus[]>(
          'z_getoperationresult',
          [[opid]]
        );
        if (results.length > 0 && results[0].result?.txid) {
          return results[0].result.txid;
        }
        throw new Error('Transaction completed but no txid returned');

      case 'failed':
        throw new Error(status.error?.message || 'Transaction failed');

      case 'cancelled':
        throw new Error('Transaction was cancelled');

      default:
        // Still executing, wait and retry
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error('Transaction timed out. Check z_getoperationstatus for updates.');
}
