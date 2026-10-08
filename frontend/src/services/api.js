const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch backend health status');
  return res.json();
}

export async function fetchFieldSummary() {
  const res = await fetch(`${API_BASE}/field/summary`);
  if (!res.ok) throw new Error('Failed to fetch field summary');
  return res.json();
}

export async function fetchWells() {
  const res = await fetch(`${API_BASE}/wells`);
  if (!res.ok) throw new Error('Failed to fetch wells list');
  return res.json();
}

export async function fetchWellDetail(wellId) {
  const res = await fetch(`${API_BASE}/wells/${encodeURIComponent(wellId)}`);
  if (!res.ok) throw new Error(`Failed to fetch details for well ${wellId}`);
  return res.json();
}

export async function fetchWellHealth(wellId) {
  const res = await fetch(`${API_BASE}/wells/${encodeURIComponent(wellId)}/health`);
  if (!res.ok) throw new Error(`Failed to fetch health for well ${wellId}`);
  return res.json();
}

export async function generateForecast(wellId, horizonDays = 30) {
  const res = await fetch(`${API_BASE}/forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ well_id: wellId, horizon_days: horizonDays })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to generate forecast');
  }
  return res.json();
}

export async function runOptimization(wellId) {
  const res = await fetch(`${API_BASE}/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ well_id: wellId })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to run scenario optimization');
  }
  return res.json();
}
