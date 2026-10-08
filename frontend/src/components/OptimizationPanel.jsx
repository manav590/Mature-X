import React, { useState, useEffect } from 'react';
import { Cpu, RefreshCw, Zap, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';
import { runOptimization } from '../services/api';

export default function OptimizationPanel({ wellId }) {
  const [loading, setLoading] = useState(false);
  const [optData, setOptData] = useState(null);
  const [error, setError] = useState(null);

  const handleRunOptimization = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await runOptimization(wellId);
      setOptData(data);
    } catch (err) {
      setError(err.message || 'Error running optimization');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (wellId) {
      handleRunOptimization();
    }
  }, [wellId]);

  const best = optData?.recommended_scenario;

  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            AI Decision Support & Operational What-If Optimiser
          </h3>
          <p className="text-xs text-gray-400">
            Multi-objective optimization evaluating bounded choke and water injection settings
          </p>
        </div>

        <button
          onClick={handleRunOptimization}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Evaluating...' : 'Re-Run Scenarios'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/30 border border-rose-900/50 rounded-xl text-xs text-rose-300">
          {error}
        </div>
      )}

      {best && (
        <>
          {/* Top Recommendation Highlight Card */}
          <div className="bg-gradient-to-br from-emerald-950/40 via-gray-900 to-cyan-950/30 border border-emerald-500/30 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <Zap className="w-4 h-4" />
                Optimal Recommended Scenario
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Decision Score: {best.score.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Choke Adjustment</span>
                <p className="text-xl font-bold font-mono mt-1 text-white">
                  {best.choke_change_pct > 0 ? `+${best.choke_change_pct}` : best.choke_change_pct}%
                </p>
                <span className="text-[11px] text-gray-500 font-sans">Wellhead opening</span>
              </div>

              <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Injection Support</span>
                <p className="text-xl font-bold font-mono mt-1 text-cyan-400">
                  {best.injection_change_pct > 0 ? `+${best.injection_change_pct}` : best.injection_change_pct}%
                </p>
                <span className="text-[11px] text-gray-500 font-sans">Water injection volume</span>
              </div>

              <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Predicted Oil Rate</span>
                <p className="text-xl font-bold font-mono mt-1 text-emerald-400">
                  {best.predicted_oil.toFixed(1)} <span className="text-xs">Sm³/d</span>
                </p>
                <span className="text-[11px] text-emerald-300 font-mono">
                  {best.oil_gain_pct >= 0 ? `+${best.oil_gain_pct.toFixed(1)}%` : `${best.oil_gain_pct.toFixed(1)}%`} uplift
                </span>
              </div>

              <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Scenario Water Cut</span>
                <p className="text-xl font-bold font-mono mt-1 text-amber-400">
                  {best.water_cut_pct.toFixed(1)}%
                </p>
                <span className="text-[11px] text-gray-400 font-mono">
                  {(best.predicted_water_cut - optData.base_water_cut) >= 0 ? '+' : ''}
                  {((best.predicted_water_cut - optData.base_water_cut) * 100).toFixed(1)} pp shift
                </span>
              </div>
            </div>
          </div>

          {/* Top Intervention Scenarios Matrix Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">
                Top Ranked Intervention Scenarios (Grid Search)
              </h4>
              <span className="text-[11px] text-gray-500 font-mono">Showing top 8 candidates</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-950/60">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 bg-gray-900/50 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Choke Δ%</th>
                    <th className="py-2.5 px-3">Injection Δ%</th>
                    <th className="py-2.5 px-3 text-right">Predicted Oil (Sm³/d)</th>
                    <th className="py-2.5 px-3 text-right">Oil Uplift %</th>
                    <th className="py-2.5 px-3 text-right">Predicted Water Cut</th>
                    <th className="py-2.5 px-3 text-right">Pressure (bar)</th>
                    <th className="py-2.5 px-3 text-center">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-mono">
                  {optData.scenarios.slice(0, 8).map((scen, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-gray-800/30 transition ${
                        idx === 0 ? 'bg-emerald-950/20 font-bold text-emerald-300' : 'text-gray-300'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        {scen.choke_change_pct > 0 ? `+${scen.choke_change_pct}` : scen.choke_change_pct}%
                      </td>
                      <td className="py-2.5 px-3 text-cyan-400">
                        {scen.injection_change_pct > 0 ? `+${scen.injection_change_pct}` : scen.injection_change_pct}%
                      </td>
                      <td className="py-2.5 px-3 text-right text-white">
                        {scen.predicted_oil.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-400">
                        {scen.oil_gain_pct > 0 ? `+${scen.oil_gain_pct.toFixed(1)}%` : `${scen.oil_gain_pct.toFixed(1)}%`}
                      </td>
                      <td className="py-2.5 px-3 text-right text-amber-300">
                        {scen.water_cut_pct.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-400">
                        {scen.pressure.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-800 text-emerald-400 border border-gray-700">
                          {scen.score.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Physical Simulator Disclaimer Banner */}
          <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-300">Engineering Honesty Notice: </span>
              The scenario optimization engine is a machine learning surrogate proxy (Random Forest Regressor) designed for rapid screening and hackathon demonstration. It is not a validated 3D causal reservoir simulator (e.g. ECLIPSE/CMG) and must be verified against field nodal analysis before operational execution.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
