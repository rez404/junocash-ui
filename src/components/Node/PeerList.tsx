import React from 'react';
import { Users, ArrowDownUp, Clock, Globe, Hammer } from 'lucide-react';
import { useNodeStore } from '../../store/nodeStore';
import { useMiningStore } from '../../store/miningStore';

export function PeerList() {
  const { peers, daemonStatus } = useNodeStore();
  const { isEnabled, setMining } = useMiningStore();

  if (!daemonStatus.running) {
    return (
      <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-xl p-6 border-2 border-slate-700">
        <div className="text-center py-8">
          <Users size={48} className="mx-auto mb-4 text-juno-500" />
          <h3 className="text-xl font-semibold mb-2 text-slate-200">Peers</h3>
          <p className="text-slate-400">Start the node to view connected peers</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-xl p-6 border-2 border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-200">Connected Peers</h2>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Users size={16} />
          <span>{peers.length} peers</span>
        </div>
      </div>

      {peers.length === 0 ? (
        <div className="space-y-4">
          <p className="text-slate-400">No peers connected</p>
          {!isEnabled && (
            <div className="p-4 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
              <p className="text-sm text-yellow-300 mb-3">
                Mining is not active. Start mining to help discover peers and secure the network.
              </p>
              <button
                onClick={() => setMining(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-juno-500 hover:bg-juno-600 rounded-lg transition-colors text-white font-semibold w-full"
              >
                <Hammer size={18} />
                <span>Start Mining</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {peers.map((peer) => (
            <div
              key={peer.id}
              className="p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-slate-400" />
                  <span className="font-mono text-sm text-slate-200">{peer.addr}</span>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    peer.inbound
                      ? 'bg-blue-900 text-blue-300'
                      : 'bg-green-900 text-green-300'
                  }`}
                >
                  {peer.inbound ? 'Inbound' : 'Outbound'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <ArrowDownUp size={12} />
                  <span>
                    ↑{formatBytes(peer.bytessent)} ↓{formatBytes(peer.bytesrecv)}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>Ping: {Math.round(peer.pingtime * 1000)}ms</span>
                </div>

                <div>
                  <span>Blocks: {peer.synced_blocks.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-2 text-xs text-slate-500 truncate">
                {peer.subver}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes >= 1e9) {
    return `${(bytes / 1e9).toFixed(1)}GB`;
  } else if (bytes >= 1e6) {
    return `${(bytes / 1e6).toFixed(1)}MB`;
  } else if (bytes >= 1e3) {
    return `${(bytes / 1e3).toFixed(1)}KB`;
  }
  return `${bytes}B`;
}
