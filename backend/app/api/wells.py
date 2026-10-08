from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from ..db.database import get_db
from ..schemas.schemas import WellItem, WellDetail, WellHealthSchema, FieldSummaryResponse
from ..services.maturex.data import load_data, field_daily, features_for_well, VOLVE_COORDS, get_data_paths
from ..services.maturex.health import calculate_well_health
import numpy as np

router = APIRouter(prefix="/api", tags=["Wells & Field"])

@router.get("/field/summary", response_model=FieldSummaryResponse)
def get_field_summary():
    df = load_data()
    fd = field_daily(df)
    health_df = calculate_well_health(df)
    raw_path, _ = get_data_paths()
    data_mode = "Volve Production Dataset (Real)" if raw_path.exists() else "Synthetic Demo Dataset"

    history = []
    for _, r in fd.iterrows():
        history.append({
            "date": r["date"].strftime("%Y-%m-%d"),
            "oil_rate": round(float(r["oil_rate"]), 1),
            "water_rate": round(float(r["water_rate"]), 1),
            "gas_rate": round(float(r["gas_rate"]), 1),
            "water_injection": round(float(r["water_injection"]), 1),
            "pressure_bar": round(float(r["pressure_bar"]), 1),
            "water_cut": round(float(r["water_cut"]), 3)
        })

    return {
        "total_wells": len(df["well"].unique()),
        "active_producers": len(health_df),
        "total_cumulative_oil": round(float(fd["oil_rate"].sum()), 1),
        "total_cumulative_water": round(float(fd["water_rate"].sum()), 1),
        "total_cumulative_gas": round(float(fd["gas_rate"].sum()), 1),
        "peak_oil_rate": round(float(fd["oil_rate"].max()), 1),
        "data_mode": data_mode,
        "daily_history": history
    }

@router.get("/wells", response_model=List[WellItem])
def get_wells():
    df = load_data()
    health_df = calculate_well_health(df)
    wells = []

    for _, r in health_df.iterrows():
        w_id = str(r["well"])
        coords = VOLVE_COORDS.get(w_id, {"lat": 58.44 + np.random.uniform(-0.01, 0.01), "lon": 1.88 + np.random.uniform(-0.01, 0.01)})
        wells.append({
            "id": w_id,
            "name": w_id,
            "field": "Volve",
            "status": "Active" if r["latest_oil"] > 10 else "Shut-in / Candidate",
            "well_type": "Producer",
            "health_score": round(float(r["health_score"]), 1),
            "priority": str(r["priority"]),
            "latest_oil": round(float(r["latest_oil"]), 1),
            "latest_water_cut": round(float(r["latest_water_cut"]), 3),
            "cumulative_oil": round(float(r["cumulative_oil"]), 1),
            "latitude": coords["lat"],
            "longitude": coords["lon"]
        })
    return wells

@router.get("/wells/{well_id:path}/health", response_model=WellHealthSchema)
def get_well_health_endpoint(well_id: str):
    df = load_data()
    health_df = calculate_well_health(df)
    w_health = health_df[health_df["well"] == well_id]
    if w_health.empty:
        raise HTTPException(status_code=404, detail=f"Well '{well_id}' health not found")
    hr = w_health.iloc[0]
    return WellHealthSchema(
        well_id=well_id,
        cumulative_oil=round(float(hr["cumulative_oil"]), 1),
        avg_oil=round(float(hr["avg_oil"]), 1),
        latest_oil=round(float(hr["latest_oil"]), 1),
        latest_water_cut=round(float(hr["latest_water_cut"]), 3),
        latest_pressure=round(float(hr["latest_pressure"]), 1),
        latest_choke=round(float(hr["latest_choke"]), 1),
        decline_pct=round(float(hr["decline_pct"]), 1),
        health_score=round(float(hr["health_score"]), 1),
        priority=str(hr["priority"])
    )

@router.get("/wells/{well_id:path}", response_model=WellDetail)
def get_well_detail(well_id: str):
    df = load_data()
    sel = df[df["well"] == well_id].sort_values("date")
    if sel.empty:
        raise HTTPException(status_code=404, detail=f"Well '{well_id}' not found")

    health_df = calculate_well_health(df)
    w_health = health_df[health_df["well"] == well_id]
    if w_health.empty:
        raise HTTPException(status_code=404, detail=f"Health metrics not available for '{well_id}'")

    hr = w_health.iloc[0]
    health_obj = WellHealthSchema(
        well_id=well_id,
        cumulative_oil=round(float(hr["cumulative_oil"]), 1),
        avg_oil=round(float(hr["avg_oil"]), 1),
        latest_oil=round(float(hr["latest_oil"]), 1),
        latest_water_cut=round(float(hr["latest_water_cut"]), 3),
        latest_pressure=round(float(hr["latest_pressure"]), 1),
        latest_choke=round(float(hr["latest_choke"]), 1),
        decline_pct=round(float(hr["decline_pct"]), 1),
        health_score=round(float(hr["health_score"]), 1),
        priority=str(hr["priority"])
    )

    history = []
    prod_sel = sel[sel["oil_rate"].fillna(0) > 0]
    for _, r in prod_sel.tail(300).iterrows():
        history.append({
            "date": r["date"].strftime("%Y-%m-%d"),
            "oil_rate": round(float(r["oil_rate"]), 1),
            "water_rate": round(float(r["water_rate"]), 1),
            "gas_rate": round(float(r["gas_rate"]), 1),
            "water_injection": round(float(r["water_injection"]), 1),
            "pressure_bar": round(float(r["pressure_bar"]), 1),
            "choke_pct": round(float(r["choke_pct"]), 1),
            "water_cut": round(float(r["water_cut"]), 3)
        })

    return {
        "id": well_id,
        "name": well_id,
        "field": "Volve",
        "status": "Active" if hr["latest_oil"] > 10 else "Shut-in / Candidate",
        "well_type": "Producer",
        "health": health_obj,
        "history": history
    }
