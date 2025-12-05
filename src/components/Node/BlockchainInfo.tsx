import React from 'react';
import { Database, Clock, HardDrive, Hash, RefreshCw, Loader2 } from 'lucide-react';
import { useNodeStore } from '../../store/nodeStore';

export function BlockchainInfo() {
  const { blockchainInfo, networkInfo } = useNodeStore();

  if (!blockchainInfo) {
    return (
      <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-xl p-6 border-2 border-slate-700">
        <div className="text-center py-8">
          <Database size={48} className="mx-auto mb-4 text-juno-500" />
          <h3 className="text-xl font-semibold mb-2 text-slate-200">Blockchain Info</h3>
          <p className="text-slate-400">Start the node to view blockchain info</p>
        </div>
      </div>
    );
  }

  // Sync progress hesaplama - headers > blocks ise sync devam ediyor
  const hasHeaders = blockchainInfo.headers > 0;
  const blocksProgress = hasHeaders
    ? (blockchainInfo.blocks / blockchainInfo.headers) * 100
    : blockchainInfo.verificationprogress * 100;

  const syncProgress = Math.round(blocksProgress * 100) / 100;

  // initialblockdownload true ise veya blocks < headers ise sync devam ediyor
  const isInitialSync = blockchainInfo.initialblockdownload === true;
  const isSyncing = blockchainInfo.blocks < blockchainInfo.headers;
  const isSynced = !isInitialSync && !isSyncing && syncProgress >= 99.9;

  return (
    <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-xl p-6 border-2 border-slate-700">
      <h2 className="text-xl font-semibold mb-6 text-slate-200">Blockchain Info</h2>

      {/* Sync progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Sync Progress</span>
            {(isSyncing || isInitialSync) && (
              <Loader2 size={14} className="animate-spin text-yellow-400" />
            )}
          </div>
          <span className={`text-sm ${isSynced ? 'text-green-400' : 'text-yellow-400'}`}>
            {isSynced ? 'Synced' : `${syncProgress}%`}
          </span>
        </div>
        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isSynced ? 'bg-green-500' : 'bg-yellow-500'
            }`}
            style={{ width: `${Math.min(syncProgress, 100)}%` }}
          />
        </div>
        {isInitialSync && (
          <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
            <RefreshCw size={12} className="animate-spin" />
            Initial sync in progress...
          </p>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4">
        <InfoCard
          icon={Database}
          label="Blocks"
          value={blockchainInfo.blocks.toLocaleString()}
          subvalue={`/ ${blockchainInfo.headers.toLocaleString()} headers`}
        />

        <InfoCard
          icon={Hash}
          label="Difficulty"
          value={formatDifficulty(blockchainInfo.difficulty)}
        />

        <InfoCard
          icon={HardDrive}
          label="Disk Usage"
          value={formatBytes(blockchainInfo.size_on_disk)}
        />

        <InfoCard
          icon={Clock}
          label="Chain"
          value={blockchainInfo.chain}
        />
      </div>

      {/* Best block hash */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <label className="block text-sm text-slate-400 mb-2">Best Block Hash</label>
        <div className="px-3 py-2 bg-slate-700/50 rounded font-mono text-xs text-slate-300 break-all">
          {blockchainInfo.bestblockhash}
        </div>
      </div>

      {/* Network info */}
      {networkInfo && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Node Version</span>
            <span className="text-slate-300">{networkInfo.subversion}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-slate-400">Protocol Version</span>
            <span className="text-slate-300">{networkInfo.protocolversion}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  subvalue,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subvalue?: string;
}) {
  return (
    <div className="p-4 bg-slate-700/50 rounded-lg">
      <div className="flex items-center gap-2 text-slate-400 mb-2">
        <Icon size={16} />
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-xl font-semibold text-slate-200">{value}</div>
      {subvalue && <div className="text-xs text-slate-500">{subvalue}</div>}
    </div>
  );
}

function formatDifficulty(difficulty: number): string {
  if (difficulty >= 1e12) {
    return `${(difficulty / 1e12).toFixed(2)}T`;
  } else if (difficulty >= 1e9) {
    return `${(difficulty / 1e9).toFixed(2)}G`;
  } else if (difficulty >= 1e6) {
    return `${(difficulty / 1e6).toFixed(2)}M`;
  } else if (difficulty >= 1e3) {
    return `${(difficulty / 1e3).toFixed(2)}K`;
  }
  return difficulty.toFixed(2);
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let value = bytes;

  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }

  return `${value.toFixed(2)} ${units[i]}`;
}
