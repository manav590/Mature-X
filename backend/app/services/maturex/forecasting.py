import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error
from typing import Tuple, Dict, Any

FEATURES = [
    "lag_7", "lag_30", "roll_7", "roll_30",
    "pressure_bar", "wellhead_pressure_bar",
    "choke_pct", "water_injection", "water_cut", "day_index"
]

def train_forecaster(well_features: pd.DataFrame) -> Tuple[Any, Dict[str, float]]:
    x = well_features.copy()
    if len(x) < 40:
        return None, {}

    X = x[FEATURES]
    y = x["oil_rate"]
    cut = max(20, int(len(x) * 0.8))

    model = HistGradientBoostingRegressor(
        max_iter=250, learning_rate=0.06, max_leaf_nodes=15, random_state=42
    )
    model.fit(X.iloc[:cut], y.iloc[:cut])
    pred = model.predict(X.iloc[cut:])
    metrics = {
        "MAE": round(float(mean_absolute_error(y.iloc[cut:], pred)), 2),
        "MAPE": round(float(mean_absolute_percentage_error(y.iloc[cut:], pred) * 100), 2)
    }
    return model, metrics

def forecast_nd(well_df: pd.DataFrame, model: Any, days: int = 30) -> pd.DataFrame:
    h = well_df.sort_values("date").copy()
    if model is None or len(h) < 31:
        return pd.DataFrame()

    hist = list(h["oil_rate"].tail(30).values)
    last = h.iloc[-1].copy()
    out = []

    for i in range(1, days + 1):
        row = {
            "lag_7": hist[-7],
            "lag_30": hist[0],
            "roll_7": float(np.mean(hist[-7:])),
            "roll_30": float(np.mean(hist)),
            "pressure_bar": float(last["pressure_bar"]),
            "wellhead_pressure_bar": float(last["wellhead_pressure_bar"]),
            "choke_pct": float(last["choke_pct"]),
            "water_injection": float(last["water_injection"]),
            "water_cut": float(last["water_cut"]),
            "day_index": float(last["day_index"] + i)
        }
        y = float(model.predict(pd.DataFrame([row])[FEATURES])[0])
        y = max(0.0, y)
        hist.append(y)
        hist = hist[-30:]
        out.append({
            "date": (last["date"] + pd.Timedelta(days=i)).strftime("%Y-%m-%d"),
            "forecast_oil": round(y, 2)
        })

    return pd.DataFrame(out)
