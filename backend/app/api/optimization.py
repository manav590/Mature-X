from fastapi import APIRouter, HTTPException
from ..schemas.schemas import OptimizeRequest, OptimizeResponse, ScenarioItem
from ..services.maturex.data import load_data
from ..services.maturex.surrogate import build_surrogate
from ..services.maturex.optimizer import run_scenarios

router = APIRouter(prefix="/api", tags=["Optimization"])

@router.post("/optimize", response_model=OptimizeResponse)
def optimize_well(req: OptimizeRequest):
    df = load_data()
    sel = df[df["well"] == req.well_id].sort_values("date")
    if sel.empty:
        raise HTTPException(status_code=404, detail=f"Well '{req.well_id}' not found")

    prod_sel = sel[sel["oil_rate"].fillna(0) > 0]
    if prod_sel.empty:
        raise HTTPException(status_code=400, detail=f"No active production records found for '{req.well_id}'")

    latest = prod_sel.iloc[-1].to_dict()
    surrogate = build_surrogate(df)
    scens = run_scenarios(surrogate, latest)

    scenario_items = [
        ScenarioItem(**s) for s in scens
    ]

    return OptimizeResponse(
        well_id=req.well_id,
        base_oil=round(float(latest.get("oil_rate", 0.0)), 1),
        base_water_cut=round(float(latest.get("water_cut", 0.0)), 4),
        base_pressure=round(float(latest.get("pressure_bar", 0.0)), 1),
        recommended_scenario=scenario_items[0],
        scenarios=scenario_items,
        caption="Decision score combines predicted oil uplift, water-cut penalty, and operational-change penalty. Surrogate model is designed for rapid decision screening."
    )

@router.get("/recommendations/{well_id:path}", response_model=OptimizeResponse)
def get_recommendation(well_id: str):
    return optimize_well(OptimizeRequest(well_id=well_id))
