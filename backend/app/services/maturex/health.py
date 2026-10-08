import pandas as pd
import numpy as np

def calculate_well_health(df: pd.DataFrame) -> pd.DataFrame:
    p = df[df["oil_rate"].fillna(0) > 0].copy()
    g = p.groupby("well")
    s = g.agg(
        cumulative_oil=("oil_rate", "sum"),
        avg_oil=("oil_rate", "mean"),
        latest_oil=("oil_rate", "last"),
        latest_pressure=("pressure_bar", "last"),
        latest_water_cut=("water_cut", "last"),
        latest_choke=("choke_pct", "last")
    ).reset_index()

    s["decline_pct"] = np.maximum(0.0, (1.0 - s["latest_oil"] / s["avg_oil"]) * 100.0)
    s["health_score"] = np.clip(
        100.0 - 0.55 * s["decline_pct"] - 45.0 * s["latest_water_cut"], 0.0, 100.0
    )
    s["priority"] = pd.cut(
        s["health_score"],
        [-1, 45, 70, 101],
        labels=["HIGH", "MEDIUM", "LOW"]
    ).astype(str)

    return s.sort_values("health_score")
