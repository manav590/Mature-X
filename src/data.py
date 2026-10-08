
import pandas as pd
import numpy as np
from pathlib import Path

def load_data():
    raw = Path("data/raw/Volve production data.xlsx")
    if raw.exists():
        df = pd.read_excel(raw, sheet_name="Daily Production Data")
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
            if c != "date" and c != "well":
                df[c] = pd.to_numeric(df[c], errors="coerce")
        if "water_cut" not in df:
            denom = df["oil_rate"].fillna(0)+df["water_rate"].fillna(0)
            df["water_cut"] = np.where(denom>0, df["water_rate"].fillna(0)/denom, 0)
        daily_inj = df.groupby("date")["water_injection"].sum()
        df["water_injection"] = df["water_injection"].fillna(0)
        is_prod = df["oil_rate"].fillna(0) > 0
        df.loc[is_prod & (df["water_injection"] == 0), "water_injection"] = df.loc[is_prod, "date"].map(daily_inj).fillna(0)
        df["pressure_bar"] = df.groupby("well")["pressure_bar"].transform(lambda s: s.ffill().bfill())
        df["pressure_bar"] = df["pressure_bar"].fillna(df["pressure_bar"].mean())
        df["wellhead_pressure_bar"] = df.groupby("well")["wellhead_pressure_bar"].transform(lambda s: s.ffill().bfill())
        df["wellhead_pressure_bar"] = df["wellhead_pressure_bar"].fillna(df["wellhead_pressure_bar"].mean())
        df["choke_pct"] = df["choke_pct"].fillna(0)
        df["is_injector"] = df["well"].astype(str).str.contains("inject", case=False, na=False)
        df["well"] = df["well"].astype(str)
        return df.dropna(subset=["date","well"])
    return pd.read_csv("data/demo/demo_production.csv", parse_dates=["date"])

def field_daily(df):
    prod = df[df["oil_rate"].fillna(0)>0].copy()
    out = prod.groupby("date", as_index=False).agg(
        oil_rate=("oil_rate","sum"),
        water_rate=("water_rate","sum"),
        gas_rate=("gas_rate","sum"),
        pressure_bar=("pressure_bar","mean"),
        water_injection=("water_injection","max")
    )
    out["water_cut"] = out["water_rate"]/(out["oil_rate"]+out["water_rate"]).replace(0,np.nan)
    return out.fillna(0)

def well_summary(df):
    p = df[df["oil_rate"].fillna(0)>0].copy()
    g = p.groupby("well")
    s = g.agg(
        cumulative_oil=("oil_rate","sum"),
        avg_oil=("oil_rate","mean"),
        latest_oil=("oil_rate","last"),
        latest_pressure=("pressure_bar","last"),
        latest_water_cut=("water_cut","last"),
        latest_choke=("choke_pct","last")
    ).reset_index()
    s["decline_pct"] = np.maximum(0, (1-s["latest_oil"]/s["avg_oil"])*100)
    s["health_score"] = np.clip(
        100 - 0.55*s["decline_pct"] - 45*s["latest_water_cut"], 0, 100
    )
    s["priority"] = pd.cut(s["health_score"], [-1,45,70,101],
                           labels=["HIGH","MEDIUM","LOW"])
    return s.sort_values("health_score")

def features_for_well(df, well):
    x = df[(df["well"]==well) & (df["oil_rate"].fillna(0)>0)].sort_values("date").copy()
    if len(x) < 30:
        return x
    x["lag_7"] = x["oil_rate"].shift(7)
    x["lag_30"] = x["oil_rate"].shift(30)
    x["roll_7"] = x["oil_rate"].rolling(7).mean()
    x["roll_30"] = x["oil_rate"].rolling(30).mean()
    x["day_index"] = (x["date"]-x["date"].min()).dt.days
    return x.dropna()
