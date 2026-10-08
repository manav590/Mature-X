import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import FieldOverview from './components/FieldOverview';
import WellList from './components/WellList';
import WellDetail from './components/WellDetail';
import { fetchFieldSummary, fetchWells } from './services/api';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [summary, setSummary] = useState(null);
  const [wells, setWells] = useState([]);
  const [selectedWellId, setSelectedWellId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, wellsData] = await Promise.all([
        fetchFieldSummary(),
        fetchWells()
      ]);
      setSummary(sumData);
      setWells(wellsData);
      if (wellsData.length > 0 && !selectedWellId) {
        // Default to first high priority well or first well
        const highPriority = wellsData.find(w => w.priority === 'HIGH');
        setSelectedWellId(highPriority ? highPriority.id : wellsData[0].id);
      }
    } catch (err) {
      setError(err.message || 'Error connecting to MATURE-X API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleSelectWell = (wellId) => {
    setSelectedWellId(wellId);
    setActiveTab('diagnostics');
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dataMode={summary?.data_mode}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-mono text-gray-400">Loading Volve field production data & surrogate models...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-950/20 border border-rose-900/50 rounded-2xl p-8 text-center max-w-lg mx-auto space-y-4 my-12">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h3 className="text-lg font-bold text-white">Backend Connection Error</h3>
            <p className="text-xs text-rose-300">{error}</p>
            <p className="text-[11px] text-gray-400">
              Ensure the FastAPI backend is running at <code className="text-white font-mono">http://127.0.0.1:8000</code>.
            </p>
            <button
              onClick={loadInitialData}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 mx-auto transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <FieldOverview
                summary={summary}
                wells={wells}
                onSelectWell={handleSelectWell}
              />
            )}

            {activeTab === 'wells' && (
              <WellList
                wells={wells}
                onSelectWell={handleSelectWell}
              />
            )}

            {activeTab === 'diagnostics' && (
              <WellDetail
                wells={wells}
                selectedWellId={selectedWellId}
                onSelectWell={setSelectedWellId}
                onBack={() => setActiveTab('overview')}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/80 bg-gray-950/50 py-6 px-6 text-center text-xs text-gray-500 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 MATURE-X • AI-Assisted Brownfield Reservoir Production Optimization</p>
          <p className="text-[11px] text-gray-600">
            Powered by FastAPI • React/Vite • scikit-learn • Equinor Volve Open Data
          </p>
        </div>
      </footer>
    </div>
  );
}
