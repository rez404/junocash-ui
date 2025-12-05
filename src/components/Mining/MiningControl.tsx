import React, { useMemo } from 'react';
import { Hammer, Power, Loader2, AlertCircle, Cpu, Zap, Box } from 'lucide-react';
import { useMiningStore } from '../../store/miningStore';

const getMaxThreads = (): number => {
  if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
    return navigator.hardwareConcurrency;
  }
  return 8;
};

export function MiningControl() {
  const {
    isEnabled,
    threads,
    miningInfo,
    isLoading,
    isToggling,
    error,
    setMining,
    setThreads,
    clearError,
  } = useMiningStore();

  const maxThreads = useMemo(() => getMaxThreads(), []);

  const handleToggle = async () => {
    try {
      await setMining(!isEnabled);
    } catch (e) {
      // Error handled in store
    }
  };

  const handleThreadChange = (newThreads: number) => {
    setThreads(Math.max(1, Math.min(maxThreads, newThreads)));
  };

  return (
    <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-lg p-6 border-2 border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-200">Mining Control</h2>
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
            isEnabled ? 'bg-juno-500/20 text-juno-500 border-juno-500' : 'bg-slate-900 text-slate-400 border-slate-700'
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              isEnabled ? 'bg-juno-500 animate-pulse' : 'bg-slate-500'
            }`}
          />
          <span className="text-sm">{isEnabled ? 'Mining' : 'Idle'}</span>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
          <button onClick={clearError} className="text-red-400 hover:text-red-300">
            &times;
          </button>
        </div>
      )}

      {/* Mining toggle */}
      <div className="mb-6 p-6 bg-slate-900 rounded-xl border border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`p-4 rounded-full ${
                isEnabled ? 'bg-juno-500' : 'bg-slate-800'
              }`}
            >
              <Hammer size={32} className={isEnabled ? 'text-white' : 'text-slate-500'} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-slate-200">
                {isEnabled ? 'Mining Active' : 'Mining Inactive'}
              </h3>
              <p className="text-sm text-slate-400">
                {isEnabled
                  ? `Using ${threads} thread${threads > 1 ? 's' : ''}`
                  : 'Click to start mining'}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggle}
            disabled={isToggling || isLoading}
            className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-colors font-semibold ${
              isEnabled
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-juno-500 hover:bg-juno-600 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isToggling ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Power size={20} />
            )}
            <span>{isEnabled ? 'Stop' : 'Start'}</span>
          </button>
        </div>
      </div>

      {/* Thread control */}
      <div className="mb-6">
        <label className="block text-sm text-slate-400 mb-3">Mining Threads</label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleThreadChange(threads - 1)}
            disabled={threads <= 1 || isToggling}
            className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 rounded-lg transition-colors text-xl border border-slate-700 text-slate-200"
          >
            -
          </button>
          <div className="flex-1">
            <input
              type="range"
              min="1"
              max={maxThreads}
              value={threads}
              onChange={(e) => handleThreadChange(parseInt(e.target.value))}
              disabled={isToggling}
              className="w-full"
            />
          </div>
          <button
            onClick={() => handleThreadChange(threads + 1)}
            disabled={threads >= maxThreads || isToggling}
            className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 rounded-lg transition-colors text-xl border border-slate-700 text-slate-200"
          >
            +
          </button>
          <div className="w-16 text-center">
            <span className="text-2xl font-bold text-slate-200">{threads}</span>
            <span className="text-sm text-slate-400 block">threads</span>
          </div>
        </div>
      </div>

      {/* Mining stats */}
      {miningInfo && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            icon={Zap}
            label="Your Hash Rate"
            value={formatHashrate(miningInfo.localsolps)}
          />
          <StatCard
            icon={Cpu}
            label="Network Hash"
            value={formatHashrate(miningInfo.networksolps)}
          />
          <StatCard
            icon={Box}
            label="Difficulty"
            value={formatNumber(miningInfo.difficulty)}
          />
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 bg-slate-900 border border-slate-700 rounded-lg">
        <p className="text-sm text-slate-400">
          <strong className="text-slate-200">Note:</strong> Mining uses significant CPU resources and will increase
          power consumption. Consider the electricity cost versus potential rewards.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
      <div className="flex items-center gap-2 text-slate-400 mb-2">
        <Icon size={16} className="text-juno-500" />
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-lg font-semibold text-slate-200">{value}</div>
    </div>
  );
}

function formatHashrate(hashps: number): string {
  if (hashps >= 1e12) {
    return `${(hashps / 1e12).toFixed(3)} TH/s`;
  } else if (hashps >= 1e9) {
    return `${(hashps / 1e9).toFixed(3)} GH/s`;
  } else if (hashps >= 1e6) {
    return `${(hashps / 1e6).toFixed(3)} MH/s`;
  } else if (hashps >= 1e3) {
    return `${(hashps / 1e3).toFixed(3)} kH/s`;
  }
  return `${hashps.toFixed(3)} H/s`;
}

function formatNumber(num: number): string {
  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(2)}B`;
  } else if (num >= 1e6) {
    return `${(num / 1e6).toFixed(2)}M`;
  } else if (num >= 1e3) {
    return `${(num / 1e3).toFixed(2)}K`;
  }
  return num.toFixed(2);
}
