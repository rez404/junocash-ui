import React, { useState, useMemo } from 'react';
import { Play, Square, Loader2, AlertCircle, RotateCw } from 'lucide-react';
import { useNodeStore } from '../../store/nodeStore';

// Get CPU thread count
const getMaxThreads = (): number => {
  if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
    return navigator.hardwareConcurrency;
  }
  return 8;
};

export function NodeControl() {
  const {
    daemonStatus,
    isStarting,
    isStopping,
    error,
    config,
    setConfig,
    startDaemon,
    stopDaemon,
    clearError,
  } = useNodeStore();

  const [showAdvanced, setShowAdvanced] = useState(false);

  const isRunning = daemonStatus.running;
  const isLoading = isStarting || isStopping;
  const maxThreads = useMemo(() => getMaxThreads(), []);

  const handleStart = async () => {
    try {
      await startDaemon();
    } catch (e) {
      // Error is handled in store
    }
  };

  const handleStop = async () => {
    try {
      await stopDaemon();
    } catch (e) {
      // Error is handled in store
    }
  };

  const handleRestart = async () => {
    try {
      await stopDaemon();
      // Wait a bit for clean shutdown
      await new Promise(resolve => setTimeout(resolve, 2000));
      await startDaemon();
    } catch (e) {
      // Error is handled in store
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-lg p-6 border-2 border-slate-700">
      <h2 className="text-xl font-semibold mb-6 text-slate-200">Node Control</h2>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-300"
          >
            &times;
          </button>
        </div>
      )}

      {/* Status indicator */}
      <div className="mb-6 p-4 bg-slate-900 rounded-lg border border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                isRunning ? 'bg-juno-500 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span className="text-lg text-slate-200">
              {isStarting
                ? 'Starting...'
                : isStopping
                ? 'Stopping...'
                : isRunning
                ? 'Running'
                : 'Stopped'}
            </span>
          </div>

          {daemonStatus.uptime !== undefined && daemonStatus.uptime > 0 && (
            <span className="text-sm text-slate-400">
              Uptime: {formatUptime(daemonStatus.uptime)}
            </span>
          )}
        </div>
      </div>

      {/* Start/Stop/Restart buttons */}
      <div className="mb-6 space-y-3">
        {isRunning ? (
          <>
            <button
              onClick={handleRestart}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-juno-500 hover:bg-juno-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-white font-semibold"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <RotateCw size={20} />
              )}
              <span>Restart Node</span>
            </button>
            <button
              onClick={handleStop}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed rounded-lg transition-colors text-white"
            >
              {isStopping ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Square size={20} />
              )}
              <span>{isStopping ? 'Stopping...' : 'Stop Node'}</span>
            </button>
          </>
        ) : (
          <button
            onClick={handleStart}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-juno-500 hover:bg-juno-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-white font-semibold"
          >
            {isStarting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Play size={20} />
            )}
            <span>{isStarting ? 'Starting...' : 'Start Node'}</span>
          </button>
        )}
      </div>

      {/* Configuration (only when stopped) */}
      {!isRunning && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium border-b border-slate-700 pb-2 text-slate-200">
            Configuration
          </h3>

          {/* Network selection */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Network</label>
            <div className="flex gap-2">
              {(['mainnet', 'testnet', 'regtest'] as const).map((network) => (
                <button
                  key={network}
                  onClick={() => setConfig({ network })}
                  className={`flex-1 py-2 px-4 rounded-lg capitalize transition-colors ${
                    config.network === network
                      ? 'bg-juno-500 text-white font-semibold'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  {network}
                </button>
              ))}
            </div>
          </div>

          {/* Thread count */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Script Verification Threads
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max={maxThreads}
                value={config.threads}
                onChange={(e) =>
                  setConfig({ threads: parseInt(e.target.value) })
                }
                className="flex-1"
              />
              <span className="w-8 text-center text-slate-200 font-semibold">{config.threads}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Your CPU: {maxThreads} threads. Higher values speed up sync but use more CPU.
            </p>
          </div>

          {/* Advanced options toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-juno-500 hover:text-juno-400 transition-colors"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>

          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t border-slate-700">
              {/* RPC User */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  RPC Username
                </label>
                <input
                  type="text"
                  value={config.rpcUser}
                  onChange={(e) => setConfig({ rpcUser: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-juno-500 text-slate-200"
                />
              </div>

              {/* RPC Password */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  RPC Password
                </label>
                <input
                  type="password"
                  value={config.rpcPassword}
                  onChange={(e) => setConfig({ rpcPassword: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-juno-500 text-slate-200"
                />
              </div>

              {/* Data Directory */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Data Directory (optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={config.dataDir || ''}
                    onChange={(e) =>
                      setConfig({ dataDir: e.target.value || undefined })
                    }
                    placeholder="Default location"
                    className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-juno-500 text-slate-200"
                  />
                  <button
                    onClick={async () => {
                      const dir = await window.junocash.dialog.selectDirectory();
                      if (dir) setConfig({ dataDir: dir });
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-200"
                  >
                    Browse
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}
