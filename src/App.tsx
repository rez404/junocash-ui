import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { BalanceCard } from './components/Dashboard/BalanceCard';
import { TransactionHistory } from './components/Wallet/TransactionHistory';
import { SendForm } from './components/Wallet/SendForm';
import { ReceiveView } from './components/Wallet/ReceiveView';
import { MiningControl } from './components/Mining/MiningControl';
import { NodeControl } from './components/Node/NodeControl';
import { BlockchainInfo } from './components/Node/BlockchainInfo';
import { PeerList } from './components/Node/PeerList';
import { BackupRestore } from './components/Settings/BackupRestore';
import { useNodeStore } from './store/nodeStore';
import { useWalletStore } from './store/walletStore';
import { useMiningStore } from './store/miningStore';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const {
    daemonStatus,
    refreshStatus,
    refreshBlockchainInfo,
    refreshPeers
  } = useNodeStore();

  const {
    refreshBalance,
    refreshAddresses,
    refreshTransactions
  } = useWalletStore();

  const { refreshMiningInfo } = useMiningStore();

  // Poll for updates when daemon is running
  useEffect(() => {
    const isRunning = daemonStatus.running;

    if (!isRunning) return;

    // Wait a bit for RPC to be ready before initial refresh
    const initialTimeout = setTimeout(async () => {
      // Try initial refresh with error handling
      try {
        await refreshBlockchainInfo();
        await refreshBalance();
        await refreshAddresses();
        await refreshTransactions();
        await refreshMiningInfo();
        await refreshPeers();
      } catch (error) {
        console.log('Initial refresh failed, will retry on interval:', error);
      }
    }, 3000); // Wait 3 seconds for RPC to be ready

    // Set up polling intervals
    const blockchainInterval = setInterval(refreshBlockchainInfo, 30000); // 30 seconds
    const balanceInterval = setInterval(refreshBalance, 30000); // 30 seconds
    const transactionsInterval = setInterval(refreshTransactions, 30000); // 30 seconds
    const miningInterval = setInterval(refreshMiningInfo, 2000); // 2 seconds
    const peersInterval = setInterval(refreshPeers, 60000); // 1 minute

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(blockchainInterval);
      clearInterval(balanceInterval);
      clearInterval(transactionsInterval);
      clearInterval(miningInterval);
      clearInterval(peersInterval);
    };
  }, [daemonStatus.running]);

  // Check daemon status on mount
  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <BalanceCard />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TransactionHistory />
              <BlockchainInfo />
            </div>
          </div>
        );

      case 'wallet':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <BalanceCard />
              <TransactionHistory />
            </div>
            <ReceiveView />
          </div>
        );

      case 'send':
        return <SendForm />;

      case 'receive':
        return <ReceiveView />;

      case 'mining':
        return <MiningControl />;

      case 'node':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <NodeControl />
              <BlockchainInfo />
            </div>
            <div className="space-y-6">
              <PeerList />
            </div>
          </div>
        );

      case 'settings':
        return <SettingsPage />;

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState<'backup' | 'about'>('backup');

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="flex gap-2 bg-slate-900 p-2 rounded-lg border border-slate-700">
        <button
          onClick={() => setActiveTab('backup')}
          className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'backup'
              ? 'bg-juno-500 text-white font-semibold'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          Backup & Restore
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'about'
              ? 'bg-juno-500 text-white font-semibold'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          About
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'backup' && <BackupRestore />}

      {activeTab === 'about' && (
        <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-lg p-6 border-2 border-slate-700">
          <h2 className="text-xl font-semibold mb-6 text-slate-200">About JunoCash Wallet</h2>

          <div className="space-y-6">
            {/* About */}
            <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
              <h3 className="font-medium mb-2 text-slate-200">Version</h3>
              <p className="text-sm text-slate-400">1.0.0</p>
            </div>

            <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
              <h3 className="font-medium mb-2 text-slate-200">Description</h3>
              <p className="text-sm text-slate-400">
                JunoCash is a privacy-focused cryptocurrency based on Zcash technology.
                This desktop wallet allows you to run your own node, manage your wallet,
                and participate in mining.
              </p>
            </div>

            {/* Links */}
            <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
              <h3 className="font-medium mb-3 text-slate-200">Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    onClick={() => window.junocash.shell.openExternal('https://juno.cash/')}
                    className="text-juno-500 hover:text-juno-400 transition-colors cursor-pointer"
                  >
                    Official Website
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => window.junocash.shell.openExternal('https://github.com/juno-cash/')}
                    className="text-juno-500 hover:text-juno-400 transition-colors cursor-pointer"
                  >
                    GitHub Repository
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => window.junocash.shell.openExternal('https://juno.cash/junocash.pdf')}
                    className="text-juno-500 hover:text-juno-400 transition-colors cursor-pointer"
                  >
                    Whitepaper (PDF)
                  </button>
                </li>
              </ul>
            </div>

            {/* Credits */}
            <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
              <h3 className="font-medium mb-3 text-slate-200">Credits</h3>
              <p className="text-sm text-slate-400 mb-2">
                Desktop wallet developed by:
              </p>
              <button
                onClick={() => window.junocash.shell.openExternal('https://github.com/rez404')}
                className="text-juno-500 hover:text-juno-400 transition-colors text-sm flex items-center gap-2 cursor-pointer"
              >
                <span>@rez404</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
