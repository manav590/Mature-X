import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { Gauge, Droplets, Activity, Percent, ArrowLeft, ShieldAlert } from 'lucide-react';
import { fetchWellDetail } from '../services/api';
import ForecastPanel from './ForecastPanel';
import OptimizationPanel from './OptimizationPanel';

export default function WellDetail({ wells, selectedWellId, onSelectWell, onBack }) {
  const [wellData, setWellData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedWellId) return;
    setLoading(true);
    setError(null);
    fetchWellDetail(selectedWellId)
      .then(data => setWellData(data))
      .catch(err => setError(err.message || 'Error loading well detail'))
      .finally(() => setLoading(false));
  }, [selectedWellId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-gray-400 font-mono">Loading telemetry for {selectedWellId}...</p>
        </div>
      </div>
    );
  }

  if (error || !wellData) {
    return (
      <div className="p-6 bg-rose-950/20 border border-rose-900/40 rounded-2xl text-center space-y-3">
        <p className="text-sm text-rose-300">{error || 'Well details unavailable'}</p>
        <button onClick={onBack} className="text-xs text-emerald-400 underline">
          Back to Overview
        </button>
      </div>
    );
  }

  const { health } = wellData;
  const isHigh = health.priority === 'HIGH';
  const isMed = health.priority === 'MEDIUM';

  return (
    <div className="space-y-6">
      {/* Top Controls & Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-900/80 border border-gray-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
            title="Back to Overview"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white font-mono">{wellData.id}</h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase ${
                  isHigh
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : isMed
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {health.priority} PRIORITY
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Producer Wellbore • Volve Field Block 15/9
            </p>
          </div>
        </div>

        {/* Well Switcher Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Switch Well:</span>
          <select
            value={selectedWellId}
            onChange={(e) => onSelectWell(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-xs text-white px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500 font-mono transition"
          >
            {wells.map(w => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.priority})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Real-time Well Status KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-3 text-center">
          <span className="text-[10px] text-gray-400 uppercase font-semibold">Latest Oil Rate</span>
          <p className="text-lg font-bold font-mono text-white mt-1">{health.latest_oil.toFixed(1)}</p>
          <span className="text-[10px] text-emerald-400">Sm³/day</span>
        </div>

        <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-3 text-center">
          <span className="text-[10px] text-gray-400 uppercase font-semibold">Water Cut</span>
          <p className="text-lg font-bold font-mono text-cyan-400 mt-1">{(health.latest_water_cut * 100).toFixed(1)}%</p>
          <span className="text-[10px] text-gray-500">Produced water</span>
        </div>

        <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-3 text-center">
          <span className="text-[10px] text-gray-400 uppercase font-semibold">Downhole Pressure</span>
          <p className="text-lg font-bold font-mono text-amber-400 mt-1">{health.latest_pressure.toFixed(1)}</p>
          <span className="text-[10px] text-gray-500">bar</span>
        </div>

        <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-3 text-center">
          <span className="text-[10px] text-gray-400 uppercase font-semibold">Operating Choke</span>
          <p className="text-lg font-bold font-mono text-purple-400 mt-1">{health.latest_choke.toFixed(1)}%</p>
          <span className="text-[10px] text-gray-500">Opening</span>
        </div>

        <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-3 text-center">
          <span className="text-[10px] text-gray-400 uppercase font-semibold">Health Score</span>
          <p className={`text-lg font-bold font-mono mt-1 ${isHigh ? 'text-rose-400' : isMed ? 'text-amber-400' : 'text-emerald-400'}`}>
            {health.health_score.toFixed(1)}
          </p>
          <span className="text-[10px] text-gray-500">Scale 0–100</span>
        </div>

        <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-3 text-center">
          <span className="text-[10px] text-gray-400 uppercase font-semibold">Decline Rate</span>
          <p className="text-lg font-bold font-mono text-rose-400 mt-1">{health.decline_pct.toFixed(1)}%</p>
          <span className="text-[10px] text-gray-500">Vs Historical Avg</span>
        </div>
      </div>

      {/* Historical Production Chart */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 shadow-xl">
        <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          {wellData.id} — Historical Multi-Phase Telemetry
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          Historical oil and water rate responses across production lifetime
        </p>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={wellData.history}>
              <defs>
                <linearGradient id="wellOil" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="wellWat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              <XAxis dataKey="date" stroke="#6B7280" fontSize={11} tickLine={false} />
              <YAxis stroke="#6B7280" fontSize={11} tickLine={false} unit=" Sm³" />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.75rem', fontSize: '12px' }}
                formatter={(val, name) => [`${Number(val).toFixed(1)} Sm³/d`, name]}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="oil_rate" name="Oil Rate" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#wellOil)" />
              <Area type="monotone" dataKey="water_rate" name="Water Rate" stroke="#06B6D4" strokeWidth={1.5} fillOpacity={1} fill="url(#wellWat)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-Column Grid: Forecasting & Scenario Optimization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ForecastPanel wellId={selectedWellId} historicalPoints={wellData.history} />
        <OptimizationPanel wellId={selectedWellId} />
      </div>
    </div>
  );
}
