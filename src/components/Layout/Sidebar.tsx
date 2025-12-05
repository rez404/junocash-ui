import React from 'react';
import {
  Wallet,
  Send,
  QrCode,
  Hammer,
  Server,
  Settings,
  Activity,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Activity },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'send', label: 'Send', icon: Send },
  { id: 'receive', label: 'Receive', icon: QrCode },
  { id: 'mining', label: 'Mining', icon: Hammer },
  { id: 'node', label: 'Node', icon: Server },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  return (
    <div className="w-64 bg-slate-900 border-r-2 border-slate-700 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b-2 border-slate-700">
        <h1 className="text-2xl font-bold text-slate-200">JunoCash</h1>
        <p className="text-sm text-slate-400">Desktop Wallet</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => onPageChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-juno-500 text-white font-semibold'
                      : 'text-slate-200 hover:bg-slate-800 hover:border hover:border-slate-700'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Version */}
      <div className="p-4 border-t-2 border-slate-700">
        <p className="text-xs text-slate-400 text-center">Version 1.0.0</p>
      </div>
    </div>
  );
}
