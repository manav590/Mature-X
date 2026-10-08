import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import logging

logger = logging.getLogger("maturex.services.surrogate")

_cached_surrogate = None

COLS = ["pressure_bar", "choke_pct", "water_injection", "water_cut"]

def build_surrogate(df: pd.DataFrame, force_retrain=False):
    global _cached_surrogate
    if _cached_surrogate is not None and not force_retrain:
        return _cached_surrogate

    p = df[df["oil_rate"].fillna(0) > 0].copy()
    p = p.dropna(subset=COLS)
    p["log_oil"] = np.log1p(p["oil_rate"])

    logger.info(f"Training surrogate model on {len(p)} samples...")
    model = RandomForestRegressor(
        n_estimators=250, max_depth=12, min_samples_leaf=4, random_state=42, n_jobs=-1
    )
    model.fit(p[COLS], p["log_oil"])
    _cached_surrogate = model
    return model

def surrogate_predict(model, pressure: float, choke: float, injection: float, water_cut: float) -> float:
    x = pd.DataFrame([{
        "pressure_bar": pressure,
        "choke_pct": choke,
        "water_injection": injection,
        "water_cut": water_cut
    }])
    pred_log = model.predict(x)[0]
    return float(np.expm1(pred_log))
