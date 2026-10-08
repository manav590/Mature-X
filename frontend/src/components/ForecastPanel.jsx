import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { TrendingUp, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { generateForecast } from '../services/api';

export default function ForecastPanel({ wellId, historicalPoints }) {
  const [horizon, setHorizon] = useState(30);
  const [loading, setLoading] = useState(false);
  const [forecastData, setForecastData] = useState(null);
  const [error, setError] = useState(null);

  const horizons = [7, 14, 30, 60];

  const handleRunForecast = async (selectedHorizon = horizon) => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateForecast(wellId, selectedHorizon);
      setForecastData(data);
    } catch (err) {
      setError(err.message || 'Error generating forecast');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (wellId) {
      handleRunForecast(horizon);
    }
  }, [wellId]);

  // Combine historical recent points with forecast points for unified chart
  const recentHistory = (historicalPoints || []).slice(-60).map(p => ({
    date: p.date,
    historical_oil: p.oil_rate,
    forecast_oil: null
  }));

  const forecastPoints = (forecastData?.forecast || []).map(p => ({
    date: p.date,
    historical_oil: null,
    forecast_oil: p.forecast_oil
  }));

  const combinedData = [...recentHistory, ...forecastPoints];

  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            AI Production Forecasting ({horizon}-Day Projection)
          </h3>
          <p className="text-xs text-gray-400">
            Autoregressive Gradient Boosting model trained on lag features, pressure, choke, and water cut
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Horizon Pills */}
          <div className="flex items-center bg-gray-800 p-1 rounded-xl border border-gray-700">
            {horizons.map((h) => (
              <button
                key={h}
                onClick={() => {
                  setHorizon(h);
                  handleRunForecast(h);
                }}
                disabled={loading}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  horizon === h
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {h}D
              </button>
            ))}
          </div>

          <button
            onClick={() => handleRunForecast(horizon)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Forecasting...' : 'Re-Forecast'}
          </button>
        </div>
      </div>

      {/* Validation Metrics Badges */}
      {forecastData && (
        <div className="flex flex-wrap items-center gap-3 bg-gray-950/60 p-3 rounded-xl border border-gray-800/80 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-gray-400 font-sans">Holdout Validation:</span>
          </div>
          <div className="bg-gray-900 px-2.5 py-1 rounded-lg border border-gray-800 text-gray-200">
            MAE: <span className="font-bold text-white">{forecastData.mae ?? 'N/A'}</span> Sm³/d
          </div>
          <div className="bg-gray-900 px-2.5 py-1 rounded-lg border border-gray-800 text-gray-200">
            MAPE: <span className="font-bold text-white">{forecastData.mape ?? 'N/A'}</span>%
          </div>
          <div className="text-[11px] text-gray-500 font-sans ml-auto">
            Chronological 80/20 train/test split to prevent temporal leakage
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-950/30 border border-rose-900/50 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Forecast Chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={combinedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
            <XAxis dataKey="date" stroke="#6B7280" fontSize={11} tickLine={false} />
            <YAxis stroke="#6B7280" fontSize={11} tickLine={false} unit=" Sm³" />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.75rem', fontSize: '12px' }}
              formatter={(val, name) => [`${Number(val).toFixed(1)} Sm³/d`, name]}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Line
              type="monotone"
              dataKey="historical_oil"
              name="Historical Production"
              stroke="#06B6D4"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="forecast_oil"
              name="AI Forecast Rate"
              stroke="#10B981"
              strokeWidth={2.5}
              strokeDasharray="4 4"
              dot={{ r: 2 }}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
