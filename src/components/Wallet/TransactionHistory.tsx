import React from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Hammer,
  Clock,
  CheckCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { useWalletStore } from '../../store/walletStore';
import type { Transaction } from '../../types/rpc';

export function TransactionHistory() {
  const { transactions, isLoadingTransactions, refreshTransactions } =
    useWalletStore();

  return (
    <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-xl p-6 border-2 border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-200">Recent Transactions</h2>
        <button
          onClick={() => refreshTransactions(20)}
          disabled={isLoadingTransactions}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 text-slate-200"
        >
          {isLoadingTransactions ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <RefreshCw size={18} />
          )}
        </button>
      </div>

      {isLoadingTransactions && transactions.length === 0 ? (
        <div className="text-center py-8">
          <Loader2 size={32} className="mx-auto mb-3 text-juno-500 animate-spin" />
          <p className="text-slate-400">Loading transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <p>No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {transactions.map((tx) => (
            <TransactionItem key={`${tx.txid}-${tx.vout}`} tx={tx} />
          ))}
        </div>
      )}
    </div>
  );
}

function TransactionItem({ tx }: { tx: Transaction }) {
  const isReceive = tx.category === 'receive' || tx.category === 'generate';
  const isMining = tx.category === 'generate' || tx.category === 'immature';
  const isConfirmed = tx.confirmations >= 6;
  const isPending = tx.confirmations === 0;

  const Icon = isMining
    ? Hammer
    : isReceive
    ? ArrowDownLeft
    : ArrowUpRight;

  const iconColor = isMining
    ? 'text-yellow-500'
    : isReceive
    ? 'text-green-500'
    : 'text-red-500';

  return (
    <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
      {/* Icon */}
      <div className={`p-2 rounded-full bg-slate-600 ${iconColor}`}>
        <Icon size={18} />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium capitalize text-slate-200">
            {tx.category === 'generate'
              ? 'Mining Reward'
              : tx.category === 'immature'
              ? 'Immature Reward'
              : tx.category}
          </span>
          {isPending ? (
            <span className="flex items-center gap-1 text-xs text-yellow-500">
              <Clock size={12} />
              Pending
            </span>
          ) : isConfirmed ? (
            <span className="flex items-center gap-1 text-xs text-green-500">
              <CheckCircle size={12} />
              Confirmed
            </span>
          ) : (
            <span className="text-xs text-slate-400">
              {tx.confirmations} confirmations
            </span>
          )}
        </div>
        <div className="text-sm text-slate-400 truncate">
          {tx.address || 'Shielded address'}
        </div>
        <div className="text-xs text-slate-500">
          {formatDate(tx.time)}
        </div>
      </div>

      {/* Amount */}
      <div className={`text-right ${isReceive ? 'text-green-400' : 'text-red-400'}`}>
        <div className="font-semibold">
          {isReceive ? '+' : '-'}{Math.abs(tx.amount).toFixed(8)}
        </div>
        <div className="text-xs text-slate-500">JUNO</div>
      </div>
    </div>
  );
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }

  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }

  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }

  // Otherwise, show full date
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
