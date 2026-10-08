import React from 'react';
import { Activity, ShieldAlert, Cpu, Database, BarChart3 } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, backendStatus, dataMode }) {
  const tabs = [
    { id: 'overview', label: 'Field Overview', icon: BarChart3 },
    { id: 'wells', label: 'Well Prioritisation', icon: ShieldAlert },
    { id: 'diagnostics', label: 'Well Diagnostics & AI', icon: Cpu },
  ];

  return (
    <header className="border-b border-gray-800 bg-[#0E131F]/90 backdrop-blur sticky top-0 z-50 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20">
            🛢️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                MATURE<span className="text-emerald-400">-X</span>
              </h1>
              <span className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PROD OPTIMIZER
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Volve Field (Block 15/9) • AI-Assisted Brownfield Decision Support
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-gray-900/80 p-1 rounded-xl border border-gray-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Status badges */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-[11px] text-gray-400 font-mono">Backend API</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              FastAPI v1.0
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs text-gray-300 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="truncate max-w-[170px]" title={dataMode}>
              {dataMode || 'Volve Dataset'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
