import pandas as pd
import numpy as np
from pathlib import Path
import logging

logger = logging.getLogger("maturex.services.data")

# Global in-memory cache to prevent re-reading raw Excel on every request
_cached_df = None
_cached_surrogate = None

# Known Volve field coordinates for map visualization
VOLVE_COORDS = {
    "15/9-F-1 C": {"lat": 58.4412, "lon": 1.8841},
    "15/9-F-11":  {"lat": 58.4435, "lon": 1.8820},
    "15/9-F-12":  {"lat": 58.4450, "lon": 1.8860},
    "15/9-F-14":  {"lat": 58.4428, "lon": 1.8885},
    "15/9-F-15 D":{"lat": 58.4465, "lon": 1.8835},
    "15/9-F-4":   {"lat": 58.4400, "lon": 1.8810},
    "15/9-F-5":   {"lat": 58.4480, "lon": 1.8890},
}

def get_data_paths():
    base = Path(__file__).resolve().parents[4] # Root of repository
    raw = base / "data" / "raw" / "Volve production data.xlsx"
    demo = base / "data" / "demo" / "demo_production.csv"
    return raw, demo

def load_data(force_reload=False) -> pd.DataFrame:
    global _cached_df
    if _cached_df is not None and not force_reload:
        return _cached_df.copy()

    raw_path, demo_path = get_data_paths()
    if raw_path.exists():
        logger.info(f"Loading raw Volve dataset: {raw_path}")
        df = pd.read_excel(raw_path, sheet_name="Daily Production Data")
        rename = {
            "DATEPRD":"date", "NPD_WELL_BORE_NAME":"well",
            "BORE_OIL_VOL":"oil_rate", "BORE_WAT_VOL":"water_rate",
            "BORE_GAS_VOL":"gas_rate", "BORE_WI_VOL":"water_injection",
            "AVG_DOWNHOLE_PRESSURE":"pressure_bar",
            "AVG_WHP_P":"wellhead_pressure_bar",
            "AVG_CHOKE_SIZE_P":"choke_pct"
        }
        df = df.rename(columns=rename)
        keep = [c for c in rename.values() if c in df.columns]
        df = df[keep].copy()
        df["date"] = pd.to_datetime(df["date"])
        for c in keep:
            if c not in ["date", "well"]:
                df[c] = pd.to_numeric(df[c], errors="coerce")

        if "water_cut" not in df:
            denom = df["oil_rate"].fillna(0) + df["water_rate"].fillna(0)
            df["water_cut"] = np.where(denom > 0, df["water_rate"].fillna(0) / denom, 0.0)

        # Field water injection mapping to producers
        daily_inj = df.groupby("date")["water_injection"].sum()
        df["water_injection"] = df["water_injection"].fillna(0.0)
        is_prod = df["oil_rate"].fillna(0) > 0
        df.loc[is_prod & (df["water_injection"] == 0), "water_injection"] = df.loc[is_prod, "date"].map(daily_inj).fillna(0.0)

        # Gauge pressure imputation
        df["pressure_bar"] = df.groupby("well")["pressure_bar"].transform(lambda s: s.ffill().bfill())
        df["pressure_bar"] = df["pressure_bar"].fillna(df["pressure_bar"].mean())

        df["wellhead_pressure_bar"] = df.groupby("well")["wellhead_pressure_bar"].transform(lambda s: s.ffill().bfill())
        df["wellhead_pressure_bar"] = df["wellhead_pressure_bar"].fillna(df["wellhead_pressure_bar"].mean())

        df["choke_pct"] = df["choke_pct"].fillna(0.0)
        df["is_injector"] = df["well"].astype(str).str.contains("inject", case=False, na=False)
        df["well"] = df["well"].astype(str)
        cleaned = df.dropna(subset=["date", "well"])
    else:
        logger.info(f"Loading synthetic demo dataset: {demo_path}")
        cleaned = pd.read_csv(demo_path, parse_dates=["date"])

    _cached_df = cleaned
    return cleaned.copy()

def field_daily(df: pd.DataFrame) -> pd.DataFrame:
    prod = df[df["oil_rate"].fillna(0) > 0].copy()
    out = prod.groupby("date", as_index=False).agg(
        oil_rate=("oil_rate", "sum"),
        water_rate=("water_rate", "sum"),
        gas_rate=("gas_rate", "sum"),
        pressure_bar=("pressure_bar", "mean"),
        water_injection=("water_injection", "max")
    )
    denom = out["oil_rate"] + out["water_rate"]
    out["water_cut"] = np.where(denom > 0, out["water_rate"] / denom, 0.0)
    return out.fillna(0.0)

def features_for_well(df: pd.DataFrame, well: str) -> pd.DataFrame:
    x = df[(df["well"] == well) & (df["oil_rate"].fillna(0) > 0)].sort_values("date").copy()
    if len(x) < 30:
        return x
    x["lag_7"] = x["oil_rate"].shift(7)
    x["lag_30"] = x["oil_rate"].shift(30)
    x["roll_7"] = x["oil_rate"].rolling(7).mean()
    x["roll_30"] = x["oil_rate"].rolling(30).mean()
    x["day_index"] = (x["date"] - x["date"].min()).dt.days
    return x.dropna()
