import React, { useState } from 'react';
import { Send, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useWalletStore } from '../../store/walletStore';

export function SendForm() {
  const {
    balance,
    transparentAddresses,
    shieldedAddresses,
    isSending,
    sendError,
    sendToAddress,
    sendShielded,
    clearSendError,
  } = useWalletStore();

  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [successTxid, setSuccessTxid] = useState<string | null>(null);

  const allAddresses = [...transparentAddresses, ...shieldedAddresses];
  const isShieldedFrom = fromAddress.startsWith('z');
  const isShieldedTo = toAddress.startsWith('z');

  const handleSend = async () => {
    if (!toAddress || !amount) return;

    setSuccessTxid(null);
    clearSendError();

    try {
      let txid: string;

      if (isShieldedFrom || isShieldedTo) {
        // Use z_sendmany for shielded transactions
        const outputs = [
          {
            address: toAddress,
            amount: parseFloat(amount),
            ...(memo && isShieldedTo ? { memo } : {}),
          },
        ];
        txid = await sendShielded(fromAddress || transparentAddresses[0], outputs);
      } else {
        // Use sendtoaddress for transparent transactions
        txid = await sendToAddress(toAddress, parseFloat(amount));
      }

      setSuccessTxid(txid);
      setToAddress('');
      setAmount('');
      setMemo('');
    } catch (error) {
      // Error is handled in store
    }
  };

  const handleSetMax = () => {
    const maxBalance = parseFloat(balance?.total || '0');
    const fee = 0.0001;
    setAmount(Math.max(0, maxBalance - fee).toFixed(8));
  };

  return (
    <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-lg p-6 border-2 border-slate-700">
      <h2 className="text-xl font-semibold mb-6 text-slate-200">Send JunoCash</h2>

      {/* Error display */}
      {sendError && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <p className="text-red-300 text-sm">{sendError}</p>
          </div>
          <button onClick={clearSendError} className="text-red-400 hover:text-red-300">
            &times;
          </button>
        </div>
      )}

      {/* Success display */}
      {successTxid && (
        <div className="mb-4 p-4 bg-green-900/50 border border-green-700 rounded-lg flex items-start gap-3">
          <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <p className="text-green-300 text-sm mb-1">Transaction sent successfully!</p>
            <p className="text-xs text-gray-400 font-mono break-all">{successTxid}</p>
          </div>
          <button
            onClick={() => setSuccessTxid(null)}
            className="text-green-400 hover:text-green-300"
          >
            &times;
          </button>
        </div>
      )}

      <div className="space-y-4">
        {/* From Address */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">From Address</label>
          <select
            value={fromAddress}
            onChange={(e) => setFromAddress(e.target.value)}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-juno-500 text-slate-200"
          >
            <option value="">Default (first available)</option>
            {allAddresses.filter(addr => typeof addr === 'string').map((addr) => (
              <option key={addr} value={addr}>
                {addr.substring(0, 20)}...{addr.substring(addr.length - 8)}
              </option>
            ))}
          </select>
        </div>

        {/* To Address */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">To Address</label>
          <input
            type="text"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            placeholder="t1... or z1..."
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-juno-500 font-mono text-sm text-slate-200"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Amount</label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00000000"
                step="0.00000001"
                min="0"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-juno-500 text-slate-200"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                JUNO
              </span>
            </div>
            <button
              onClick={handleSetMax}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 text-slate-200"
            >
              MAX
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Available: {parseFloat(balance?.total || '0').toFixed(8)} JUNO
          </p>
        </div>

        {/* Memo (only for shielded) */}
        {isShieldedTo && (
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Memo (optional, encrypted)
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Private message to recipient..."
              rows={2}
              maxLength={512}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-juno-500 resize-none text-slate-200"
            />
            <p className="text-xs text-slate-500 mt-1">
              {memo.length}/512 characters
            </p>
          </div>
        )}

        {/* Fee notice */}
        <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Network Fee</span>
            <span className="text-slate-200">0.0001 JUNO</span>
          </div>
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={isSending || !toAddress || !amount}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-juno-500 hover:bg-juno-600 disabled:bg-slate-800 disabled:cursor-not-allowed rounded-lg transition-colors text-lg font-medium text-white"
        >
          {isSending ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send size={20} />
              <span>Send</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
