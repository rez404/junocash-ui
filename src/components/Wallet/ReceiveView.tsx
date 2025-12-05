import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Plus, Check, Loader2, Shield, Eye, AlertCircle } from 'lucide-react';
import { useWalletStore } from '../../store/walletStore';

export function ReceiveView() {
  const {
    transparentAddresses,
    shieldedAddresses,
    isLoadingAddresses,
    createTransparentAddress,
    createShieldedAddress,
  } = useWalletStore();

  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [addressType, setAddressType] = useState<'transparent' | 'shielded'>('transparent');
  const [error, setError] = useState<string | null>(null);

  const addresses = addressType === 'transparent' ? transparentAddresses : shieldedAddresses;
  const hasNoAddresses = transparentAddresses.length === 0 && shieldedAddresses.length === 0;

  // Set initial selected address
  React.useEffect(() => {
    if (!selectedAddress && addresses.length > 0) {
      setSelectedAddress(addresses[0]);
    }
  }, [addresses, selectedAddress]);

  const handleCopy = async () => {
    if (!selectedAddress) return;
    await navigator.clipboard.writeText(selectedAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateAddress = async () => {
    setIsCreating(true);
    setError(null);
    try {
      const newAddress =
        addressType === 'transparent'
          ? await createTransparentAddress()
          : await createShieldedAddress();
      setSelectedAddress(newAddress);
    } catch (error: any) {
      console.error('Failed to create address:', error);
      setError(error.message || 'Failed to create address');
    }
    setIsCreating(false);
  };

  // Show loading state if addresses are being loaded
  if (isLoadingAddresses && hasNoAddresses) {
    return (
      <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-xl p-6 border-2 border-slate-700">
        <h2 className="text-xl font-semibold mb-6 text-slate-200">Receive JunoCash</h2>
        <div className="text-center py-8">
          <Loader2 size={48} className="mx-auto mb-4 text-juno-500 animate-spin" />
          <h3 className="text-xl font-semibold mb-2 text-slate-200">Loading Addresses...</h3>
          <p className="text-slate-400">Syncing wallet data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-xl p-6 border-2 border-slate-700">
      <h2 className="text-xl font-semibold mb-6 text-slate-200">Receive JunoCash</h2>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            &times;
          </button>
        </div>
      )}

      {/* Address type toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => {
            setAddressType('transparent');
            setSelectedAddress(transparentAddresses[0] || '');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-colors ${
            addressType === 'transparent'
              ? 'bg-juno-500 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          <Eye size={18} />
          <span>Transparent</span>
        </button>
        <button
          onClick={() => {
            setAddressType('shielded');
            setSelectedAddress(shieldedAddresses[0] || '');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-colors ${
            addressType === 'shielded'
              ? 'bg-juno-500 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          <Shield size={18} />
          <span>Shielded</span>
        </button>
      </div>

      {/* QR Code */}
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-white rounded-xl">
          {selectedAddress ? (
            <QRCodeSVG value={selectedAddress} size={200} level="M" />
          ) : (
            <div className="w-[200px] h-[200px] flex items-center justify-center text-gray-400">
              No address
            </div>
          )}
        </div>
      </div>

      {/* Address display */}
      <div className="mb-6">
        <label className="block text-sm text-slate-400 mb-2">
          {addressType === 'transparent' ? 'Transparent' : 'Shielded'} Address
        </label>
        <div className="flex gap-2">
          <div className="flex-1 px-4 py-3 bg-slate-700 rounded-lg font-mono text-sm break-all text-slate-200">
            {selectedAddress || 'No address available'}
          </div>
          <button
            onClick={handleCopy}
            disabled={!selectedAddress}
            className="px-4 py-3 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg transition-colors text-slate-200"
          >
            {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
          </button>
        </div>
      </div>

      {/* Address selector */}
      {addresses.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm text-slate-400 mb-2">Select Address</label>
          <select
            value={selectedAddress}
            onChange={(e) => setSelectedAddress(e.target.value)}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-juno-500 text-slate-200"
          >
            {addresses.filter(addr => typeof addr === 'string').map((addr, idx) => (
              <option key={addr} value={addr}>
                {idx + 1}. {addr.substring(0, 16)}...{addr.substring(addr.length - 8)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Create new address button */}
      <button
        onClick={handleCreateAddress}
        disabled={isCreating || isLoadingAddresses}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg transition-colors text-slate-200"
      >
        {isCreating ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            <span>Creating...</span>
          </>
        ) : (
          <>
            <Plus size={18} />
            <span>Create New {addressType === 'transparent' ? 'Transparent' : 'Shielded'} Address</span>
          </>
        )}
      </button>

      {/* Info */}
      <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
        <h4 className="text-sm font-medium mb-2 text-slate-200">
          {addressType === 'transparent' ? 'Transparent Addresses' : 'Shielded Addresses'}
        </h4>
        <p className="text-xs text-slate-400">
          {addressType === 'transparent'
            ? 'Transparent addresses (t-addr) are similar to Bitcoin addresses. Transactions are publicly visible on the blockchain.'
            : 'Shielded addresses (z-addr) provide full privacy. Transaction amounts and memo fields are encrypted and only visible to the sender and receiver.'}
        </p>
      </div>
    </div>
  );
}
