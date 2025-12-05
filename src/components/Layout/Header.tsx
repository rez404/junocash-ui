import React from 'react';
import { Circle, Wifi, WifiOff, Database, Clock } from 'lucide-react';
import { useNodeStore } from '../../store/nodeStore';

export function Header() {
  const { daemonStatus, blockchainInfo, networkInfo } = useNodeStore();

  const isRunning = daemonStatus.running;
  const syncProgress = blockchainInfo
    ? Math.round(blockchainInfo.verificationprogress * 100)
    : 0;
  const isSynced = syncProgress >= 99.9;

  return (
    <header className="h-14 bg-slate-900 border-b-2 border-slate-700 flex items-center justify-between px-6">
      {/* Left side - Node status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Circle
            size={10}
            className={isRunning ? 'fill-juno-500 text-juno-500' : 'fill-red-500 text-red-500'}
          />
          <span className="text-sm text-slate-200">
            {isRunning ? 'Node Running' : 'Node Stopped'}
          </span>
        </div>

        {isRunning && blockchainInfo && (
          <>
            <div className="w-px h-4 bg-slate-700" />
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Database size={14} className="text-juno-500" />
              <span>Block {blockchainInfo.blocks.toLocaleString()}</span>
            </div>

            <div className="w-px h-4 bg-slate-700" />
            <div className="flex items-center gap-2 text-sm text-slate-400">
              {isSynced ? (
                <Wifi size={14} className="text-juno-500" />
              ) : (
                <Clock size={14} className="text-yellow-500 animate-pulse" />
              )}
              <span>{isSynced ? 'Synced' : `Syncing ${syncProgress}%`}</span>
            </div>
          </>
        )}
      </div>

      {/* Right side - Network info */}
      <div className="flex items-center gap-4">
        {isRunning && networkInfo && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Wifi size={14} className="text-juno-500" />
            <span>{networkInfo.connections} peers</span>
          </div>
        )}

        {blockchainInfo && (
          <div className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200">
            {blockchainInfo.chain === 'main' ? 'Mainnet' : 'Testnet'}
          </div>
        )}
      </div>
    </header>
  );
}
