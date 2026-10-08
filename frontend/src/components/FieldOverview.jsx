import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { Droplet, Flame, Layers, TrendingUp, AlertTriangle, ArrowUpRight } from 'lucide-react';

export default function FieldOverview({ summary, wells, onSelectWell }) {
  const [metricFilter, setMetricFilter] = useState('oil');

  if (!summary) return null;

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4 relative overflow-hidden group hover:border-emerald-500/50 transition">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition text-emerald-400">
            <Droplet className="w-16 h-16" />
          </div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cumulative Oil</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {(summary.total_cumulative_oil / 1e6).toFixed(2)}M
            </span>
            <span className="text-xs text-emerald-400 font-mono">Sm³</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-500">~63.1M standard barrels</p>
        </div>

        <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4 relative overflow-hidden group hover:border-cyan-500/50 transition">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition text-cyan-400">
            <Layers className="w-16 h-16" />
          </div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cumulative Water</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {(summary.total_cumulative_water / 1e6).toFixed(2)}M
            </span>
            <span className="text-xs text-cyan-400 font-mono">Sm³</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Field-wide produced water</p>
        </div>

        <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4 relative overflow-hidden group hover:border-amber-500/50 transition">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition text-amber-400">
            <Flame className="w-16 h-16" />
          </div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cumulative Gas</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {(summary.total_cumulative_gas / 1e9).toFixed(2)}B
            </span>
            <span className="text-xs text-amber-400 font-mono">Sm³</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Associated solution gas</p>
        </div>

        <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4 relative overflow-hidden group hover:border-purple-500/50 transition">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition text-purple-400">
            <TrendingUp className="w-16 h-16" />
          </div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Peak Oil Rate</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {summary.peak_oil_rate.toLocaleString()}
            </span>
            <span className="text-xs text-purple-400 font-mono">Sm³/d</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Recorded Aug 10, 2009</p>
        </div>

        <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4 relative overflow-hidden group hover:border-rose-500/50 transition">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition text-rose-400">
            <AlertTriangle className="w-16 h-16" />
          </div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Producers / High Risk</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {summary.active_producers}
            </span>
            <span className="text-xs text-rose-400 font-mono">
              ({wells.filter(w => w.priority === 'HIGH').length} High Priority)
            </span>
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Volve Field Block 15/9</p>
        </div>
      </div>

      {/* Field Production Trajectory Chart */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              Field-Wide Production Trajectory & History
            </h2>
            <p className="text-xs text-gray-400">
              Daily aggregates of oil production, water cut, and water injection support across 2008–2016
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMetricFilter('oil')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                metricFilter === 'oil'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Oil & Water Rate
            </button>
            <button
              onClick={() => setMetricFilter('injection')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                metricFilter === 'injection'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Water Injection Support
            </button>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={summary.daily_history}>
              <defs>
                <linearGradient id="oilGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="watGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="injGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              <XAxis dataKey="date" stroke="#6B7280" fontSize={11} tickLine={false} />
              <YAxis stroke="#6B7280" fontSize={11} tickLine={false} unit=" Sm³" />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.75rem', fontSize: '12px' }}
                formatter={(val, name) => [`${Number(val).toLocaleString()} Sm³/d`, name]}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              {metricFilter === 'oil' ? (
                <>
                  <Area type="monotone" dataKey="oil_rate" name="Field Oil Rate" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#oilGrad)" />
                  <Area type="monotone" dataKey="water_rate" name="Field Water Rate" stroke="#06B6D4" strokeWidth={1.5} fillOpacity={1} fill="url(#watGrad)" />
                </>
              ) : (
                <Area type="monotone" dataKey="water_injection" name="Water Injection" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#injGrad)" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Well Spatial / Status Grid */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Volve Producers at a Glance</h3>
            <p className="text-xs text-gray-400">Click any well card to inspect diagnostics, forecasting, and scenario optimization</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wells.map((well) => {
            const isHigh = well.priority === 'HIGH';
            const isMed = well.priority === 'MEDIUM';
            return (
              <div
                key={well.id}
                onClick={() => onSelectWell(well.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isHigh
                    ? 'bg-rose-950/20 border-rose-900/50 hover:border-rose-500/80 hover:bg-rose-900/30'
                    : isMed
                    ? 'bg-amber-950/20 border-amber-900/50 hover:border-amber-500/80 hover:bg-amber-900/30'
                    : 'bg-emerald-950/20 border-emerald-900/50 hover:border-emerald-500/80 hover:bg-emerald-900/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-base font-mono">{well.name}</span>
                  <span
                    className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full uppercase tracking-wider ${
                      isHigh
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : isMed
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {well.priority} PRIORITY
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center bg-gray-900/60 p-2.5 rounded-lg border border-gray-800/60">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase">Rate</span>
                    <p className="text-xs font-bold text-white font-mono">{well.latest_oil.toFixed(0)} Sm³/d</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase">Water Cut</span>
                    <p className="text-xs font-bold text-cyan-400 font-mono">{(well.latest_water_cut * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase">Health</span>
                    <p className="text-xs font-bold text-emerald-400 font-mono">{well.health_score.toFixed(0)} / 100</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-400 font-medium">
                  <span>Cum. Oil: {(well.cumulative_oil / 1e3).toFixed(0)}k Sm³</span>
                  <span className="flex items-center gap-1 text-emerald-400 hover:underline">
                    Inspect <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
