import React, { useState } from 'react';
import { ShieldAlert, ArrowUpDown, ChevronRight, Info } from 'lucide-react';

export default function WellList({ wells, onSelectWell }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');

  const filteredWells = wells.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'ALL' || w.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-900/80 border border-gray-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            Well Health & Intervention Prioritisation Matrix
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Brownfield wells scored dynamically by production decline percentage and water cut severity
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search well..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-xs text-white px-3.5 py-2 rounded-xl focus:outline-none focus:border-emerald-500 transition w-36 sm:w-48"
          />
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-xs text-white px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Formula Explanation Callout */}
      <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-4 flex items-start gap-3 text-xs text-gray-300">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-emerald-300">Automated Scoring Formulation: </span>
          <code className="text-emerald-200 font-mono bg-emerald-900/30 px-1.5 py-0.5 rounded">
            Health = clip(100 - 0.55 × Decline% - 45 × WaterCut, 0, 100)
          </code>
          . Wells with Health &lt; 45 are tagged <span className="text-rose-400 font-bold">HIGH Priority</span> (candidate for water shut-off, workover, or choke intervention); 45–70 are <span className="text-amber-400 font-bold">MEDIUM Priority</span>; &gt; 70 are <span className="text-emerald-400 font-bold">LOW Priority</span>.
        </div>
      </div>

      {/* Wells Prioritisation Table */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950/60 text-gray-400 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Well Bore Name</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Cumulative Oil (Sm³)</th>
                <th className="py-3.5 px-4 text-right">Latest Rate (Sm³/d)</th>
                <th className="py-3.5 px-4 text-right">Water Cut</th>
                <th className="py-3.5 px-4 text-center">Health Gauge</th>
                <th className="py-3.5 px-4 text-center">Priority</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono">
              {filteredWells.map((well) => {
                const isHigh = well.priority === 'HIGH';
                const isMed = well.priority === 'MEDIUM';
                return (
                  <tr
                    key={well.id}
                    className="hover:bg-gray-800/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectWell(well.id)}
                  >
                    <td className="py-4 px-4 font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      {well.name}
                    </td>
                    <td className="py-4 px-4 text-gray-300 font-sans">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-gray-800 text-gray-300">
                        {well.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right text-gray-200">
                      {well.cumulative_oil.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-white">
                      {well.latest_oil.toFixed(1)}
                    </td>
                    <td className="py-4 px-4 text-right text-cyan-400">
                      {(well.latest_water_cut * 100).toFixed(1)}%
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2 font-sans">
                        <div className="w-20 bg-gray-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isHigh ? 'bg-rose-500' : isMed ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(5, well.health_score)}%` }}
                          ></div>
                        </div>
                        <span className="font-mono text-xs text-white">{well.health_score.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center font-sans">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase ${
                          isHigh
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : isMed
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {well.priority}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-sans">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectWell(well.id);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 text-xs font-medium transition flex items-center gap-1 mx-auto"
                      >
                        Analyze <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
