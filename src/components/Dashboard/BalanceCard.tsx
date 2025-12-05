import React from 'react';
import { Eye, EyeOff, RefreshCw, Loader2, Power } from 'lucide-react';
import { useWalletStore } from '../../store/walletStore';
import { useNodeStore } from '../../store/nodeStore';

export function BalanceCard() {
  const { balance, isLoadingBalance, refreshBalance } = useWalletStore();
  const { daemonStatus, startDaemon, isStarting } = useNodeStore();
  const [showBalance, setShowBalance] = React.useState(true);

  const transparentBalance = parseFloat(balance?.transparent || '0');
  const shieldedBalance = parseFloat(balance?.private || '0');
  const totalBalance = parseFloat(balance?.total || '0');

  // Show start button if node is not running
  if (!daemonStatus.running) {
    return (
      <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-xl p-6 border-2 border-slate-700">
        <div className="text-center py-8">
          <Power size={48} className="mx-auto mb-4 text-juno-500" />
          <h3 className="text-xl font-semibold mb-2 text-slate-200">Node Not Running</h3>
          <p className="text-slate-400 mb-6">Start the node to view your balance and make transactions</p>
          <button
            onClick={startDaemon}
            disabled={isStarting}
            className="px-6 py-3 bg-juno-500 hover:bg-juno-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {isStarting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Starting Node...
              </>
            ) : (
              <>
                <Power size={20} />
                Start Node
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Show loading state if node is running but balance not loaded yet
  if (!balance) {
    return (
      <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-xl p-6 border-2 border-slate-700">
        <div className="text-center py-8">
          <Loader2 size={48} className="mx-auto mb-4 text-juno-500 animate-spin" />
          <h3 className="text-xl font-semibold mb-2 text-slate-200">Loading Balance...</h3>
          <p className="text-slate-400">Syncing wallet data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-xl p-6 border-2 border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-slate-200">Total Balance</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-200"
          >
            {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          <button
            onClick={refreshBalance}
            disabled={isLoadingBalance}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 text-slate-200"
          >
            {isLoadingBalance ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <RefreshCw size={18} />
            )}
          </button>
        </div>
      </div>

      {/* Total balance */}
      <div className="mb-6">
        <div className="text-4xl font-bold text-slate-200">
          {showBalance ? (
            <>
              {totalBalance.toFixed(8)} <span className="text-xl opacity-75">JUNO</span>
            </>
          ) : (
            '••••••••'
          )}
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <div className="text-sm text-slate-400 mb-1">Transparent</div>
          <div className="text-xl font-semibold text-slate-200">
            {showBalance ? transparentBalance.toFixed(4) : '••••'}
          </div>
        </div>
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
          <div className="text-sm text-slate-400 mb-1">Shielded</div>
          <div className="text-xl font-semibold text-slate-200">
            {showBalance ? shieldedBalance.toFixed(4) : '••••'}
          </div>
        </div>
      </div>
    </div>
  );
}
