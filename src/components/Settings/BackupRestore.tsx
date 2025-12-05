import React, { useState } from 'react';
import {
  Download,
  Upload,
  Key,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Shield,
  FolderOpen,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';

export function BackupRestore() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Private key export
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKeyAddress, setPrivateKeyAddress] = useState('');
  const [exportedPrivateKey, setExportedPrivateKey] = useState('');
  const [isExportingKey, setIsExportingKey] = useState(false);

  // Import private key
  const [importPrivateKey, setImportPrivateKey] = useState('');
  const [importLabel, setImportLabel] = useState('');
  const [isImportingKey, setIsImportingKey] = useState(false);

  const clearMessage = () => setMessage(null);

  // Backup wallet.dat file
  const handleBackupWallet = async () => {
    setIsBackingUp(true);
    clearMessage();
    try {
      const result = await window.junocash.dialog.selectDirectory();
      if (!result) {
        setIsBackingUp(false);
        return;
      }

      // Daemon data dizinini bul
      const exportDir = await window.junocash.daemon.getExportDir();
      if (!exportDir) {
        throw new Error('Could not determine data directory. Make sure daemon is running.');
      }

      const dataDir = exportDir.replace('/export', '');
      const timestamp = Date.now();

      // wallet.dat dosyasını direkt kopyala
      const srcPath = `${dataDir}/wallet.dat`;
      const destPath = `${result}/junocash_wallet_backup_${timestamp}.dat`;

      await window.junocash.fs.copyFile(srcPath, destPath);
      setMessage({ type: 'success', text: `Wallet backed up to: ${destPath}` });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
    setIsBackingUp(false);
  };

  // Export all keys (z_exportwallet)
  const handleExportWallet = async () => {
    setIsExporting(true);
    clearMessage();
    try {
      // Get export directory from daemon
      const exportDir = await window.junocash.daemon.getExportDir();
      if (!exportDir) {
        throw new Error('Export directory not available. Make sure daemon is running.');
      }

      // Select destination directory
      const destDir = await window.junocash.dialog.selectDirectory();
      if (!destDir) {
        setIsExporting(false);
        return;
      }

      const timestamp = Date.now();

      // Export to daemon's export dir (z_exportwallet only accepts ALPHANUMERIC filename)
      const simpleFilename = `junocashkeys${timestamp}`;
      await window.junocash.rpc.call('z_exportwallet', [simpleFilename]);

      // Copy from export dir to user's selected location with proper name
      const srcPath = `${exportDir}/${simpleFilename}`;
      const destPath = `${destDir}/junocash_keys_${timestamp}.txt`;

      // Biraz bekle, dosya yazılsın
      await new Promise(resolve => setTimeout(resolve, 500));

      await window.junocash.fs.copyFile(srcPath, destPath);

      setMessage({ type: 'success', text: `Keys exported to: ${destPath}` });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
    setIsExporting(false);
  };

  // Import wallet keys (z_importwallet)
  const handleImportWallet = async () => {
    setIsImporting(true);
    clearMessage();
    try {
      const filePath = await window.junocash.dialog.selectFile?.();
      if (!filePath) {
        setIsImporting(false);
        return;
      }

      await window.junocash.rpc.call('z_importwallet', [filePath]);
      setMessage({ type: 'success', text: 'Wallet keys imported successfully! Please restart the node.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
    setIsImporting(false);
  };

  // Export single private key
  const handleExportPrivateKey = async () => {
    if (!privateKeyAddress) return;
    setIsExportingKey(true);
    clearMessage();
    try {
      // Try transparent first, then shielded
      let key: string;
      if (privateKeyAddress.startsWith('t')) {
        key = await window.junocash.rpc.call<string>('dumpprivkey', [privateKeyAddress]);
      } else {
        key = await window.junocash.rpc.call<string>('z_exportkey', [privateKeyAddress]);
      }
      setExportedPrivateKey(key);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
    setIsExportingKey(false);
  };

  // Import single private key
  const handleImportPrivateKey = async () => {
    if (!importPrivateKey) return;
    setIsImportingKey(true);
    clearMessage();
    try {
      // Detect key type based on prefix
      if (importPrivateKey.startsWith('secret-extended-key') || importPrivateKey.startsWith('p')) {
        // Shielded key
        await window.junocash.rpc.call('z_importkey', [importPrivateKey, 'yes', 0]);
      } else {
        // Transparent key
        await window.junocash.rpc.call('importprivkey', [importPrivateKey, importLabel || '', true]);
      }
      setMessage({ type: 'success', text: 'Private key imported successfully!' });
      setImportPrivateKey('');
      setImportLabel('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
    setIsImportingKey(false);
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'Copied to clipboard!' });
    setTimeout(clearMessage, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Message display */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-green-900/50 border border-green-700'
              : 'bg-red-900/50 border border-red-700'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={18} />
          ) : (
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
          )}
          <p className={`text-sm ${message.type === 'success' ? 'text-green-300' : 'text-red-300'}`}>
            {message.text}
          </p>
          <button
            onClick={clearMessage}
            className={`ml-auto ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}
          >
            &times;
          </button>
        </div>
      )}

      {/* Grid layout for cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Wallet Backup Section */}
      <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-xl p-6 border-2 border-slate-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-200">
          <Shield size={20} className="text-juno-500" />
          Wallet Backup
        </h3>

        <p className="text-sm text-slate-400 mb-4">
          Create a backup of your wallet.dat file. This contains all your keys and transaction history.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleBackupWallet}
            disabled={isBackingUp}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-juno-500 hover:bg-juno-600 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg transition-colors text-white"
          >
            {isBackingUp ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Download size={18} />
            )}
            <span>Backup Wallet File</span>
          </button>

          <button
            onClick={handleExportWallet}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg transition-colors text-slate-200"
          >
            {isExporting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <FileText size={18} />
            )}
            <span>Export All Keys</span>
          </button>
        </div>
      </div>

      {/* Import Wallet Section */}
      <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-xl p-6 border-2 border-slate-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-200">
          <Upload size={20} className="text-juno-500" />
          Import Wallet
        </h3>

        <p className="text-sm text-slate-400 mb-4">
          Import keys from a previously exported wallet file.
        </p>

        <button
          onClick={handleImportWallet}
          disabled={isImporting}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg transition-colors text-slate-200"
        >
          {isImporting ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <FolderOpen size={18} />
          )}
          <span>Import Wallet Keys</span>
        </button>
      </div>

      {/* Export Private Key Section */}
      <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-xl p-6 border-2 border-slate-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-200">
          <Key size={20} className="text-juno-500" />
          Export Private Key
        </h3>

        <p className="text-sm text-slate-400 mb-4">
          Export the private key for a specific address. Keep this key secure!
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Address</label>
            <input
              type="text"
              value={privateKeyAddress}
              onChange={(e) => setPrivateKeyAddress(e.target.value)}
              placeholder="t1... or z1..."
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-juno-500 font-mono text-sm text-slate-200"
            />
          </div>

          <button
            onClick={handleExportPrivateKey}
            disabled={isExportingKey || !privateKeyAddress}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg transition-colors text-slate-200"
          >
            {isExportingKey ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Key size={18} />
            )}
            <span>Export Key</span>
          </button>

          {exportedPrivateKey && (
            <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-yellow-300 font-medium">Private Key (KEEP SECRET!)</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    className="p-1 text-yellow-400 hover:text-yellow-300"
                  >
                    {showPrivateKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(exportedPrivateKey)}
                    className="p-1 text-yellow-400 hover:text-yellow-300"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              <div className="font-mono text-xs text-gray-300 break-all">
                {showPrivateKey ? exportedPrivateKey : '•'.repeat(64)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Import Private Key Section */}
      <div className="bg-gradient-to-br from-slate-950 to-slate-900 rounded-xl p-6 border-2 border-slate-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-200">
          <Upload size={20} className="text-juno-500" />
          Import Private Key
        </h3>

        <p className="text-sm text-slate-400 mb-4">
          Import a single private key to your wallet.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Private Key</label>
            <input
              type="password"
              value={importPrivateKey}
              onChange={(e) => setImportPrivateKey(e.target.value)}
              placeholder="Enter private key..."
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-juno-500 font-mono text-sm text-slate-200"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Label (optional)</label>
            <input
              type="text"
              value={importLabel}
              onChange={(e) => setImportLabel(e.target.value)}
              placeholder="My imported address"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-juno-500 text-slate-200"
            />
          </div>

          <button
            onClick={handleImportPrivateKey}
            disabled={isImportingKey || !importPrivateKey}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-juno-500 hover:bg-juno-600 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg transition-colors text-white"
          >
            {isImportingKey ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Upload size={18} />
            )}
            <span>Import Key</span>
          </button>
        </div>
      </div>

      </div>

      {/* Warning - Full width below grid */}
      <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-lg">
        <h4 className="text-sm font-medium text-red-300 mb-2">Security Warning</h4>
        <ul className="text-xs text-red-400 space-y-1">
          <li>• Never share your private keys or wallet backup with anyone</li>
          <li>• Store backups in a secure, encrypted location</li>
          <li>• Exposing private keys can result in loss of funds</li>
          <li>• Always verify the destination when exporting keys</li>
        </ul>
      </div>
    </div>
  );
}
