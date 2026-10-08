import numpy as np
from typing import List, Dict, Any
from .surrogate import surrogate_predict

def run_scenarios(model, current: Dict[str, Any]) -> List[Dict[str, Any]]:
    base_choke = float(current.get("choke_pct", 30.0))
    base_inj = float(current.get("water_injection", 5000.0))
    base_p = float(current.get("pressure_bar", 200.0))
    base_wc = float(current.get("water_cut", 0.5))
    base_oil = float(current.get("oil_rate", 100.0))

    rows = []
    # Grid of choke changes and injection changes
    for dc in [-10, -5, 0, 5, 10]:
        for di in [-15, -8, 0, 8, 15]:
            choke = float(np.clip(base_choke * (1.0 + dc / 100.0), 5.0, 100.0))
            inj = float(max(0.0, base_inj * (1.0 + di / 100.0)))

            # Reservoir response proxy
            pressure = float(np.clip(base_p + 0.06 * (inj - base_inj), 80.0, 350.0))
            wc = float(np.clip(base_wc + 0.00018 * (inj - base_inj) - 0.0008 * (choke - base_choke), 0.01, 0.99))

            pred = surrogate_predict(model, pressure, choke, inj, wc)

            # Economic & operational penalties
            oil_gain = (pred - base_oil) / max(base_oil, 1.0) * 100.0
            water_penalty = max(0.0, wc - base_wc) * 100.0
            change_penalty = abs(dc) * 0.12 + abs(di) * 0.06
            score = oil_gain - 0.7 * water_penalty - change_penalty

            rows.append({
                "choke_change_pct": float(dc),
                "injection_change_pct": float(di),
                "predicted_oil": round(pred, 1),
                "oil_gain_pct": round(oil_gain, 1),
                "predicted_water_cut": round(wc, 4),
                "water_cut_pct": round(wc * 100.0, 1),
                "pressure": round(pressure, 1),
                "score": round(score, 2)
            })

    return sorted(rows, key=lambda r: r["score"], reverse=True)
