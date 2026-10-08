from fastapi import APIRouter, HTTPException
from ..schemas.schemas import ForecastRequest, ForecastResponse, ForecastPoint
from ..services.maturex.data import load_data, features_for_well
from ..services.maturex.forecasting import train_forecaster, forecast_nd

router = APIRouter(prefix="/api", tags=["Forecasting"])

@router.post("/forecast", response_model=ForecastResponse)
def generate_forecast(req: ForecastRequest):
    df = load_data()
    features = features_for_well(df, req.well_id)
    if features.empty or len(features) < 30:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient historical data for well '{req.well_id}' to train forecaster."
        )

    model, metrics = train_forecaster(features)
    if model is None:
        raise HTTPException(
            status_code=500,
            detail="Failed to fit forecasting model."
        )

    fc_df = forecast_nd(features, model, days=req.horizon_days)
    points = [
        ForecastPoint(date=r["date"], forecast_oil=r["forecast_oil"])
        for _, r in fc_df.iterrows()
    ]

    return ForecastResponse(
        well_id=req.well_id,
        horizon_days=req.horizon_days,
        mae=metrics.get("MAE"),
        mape=metrics.get("MAPE"),
        forecast=points
    )

@router.get("/forecasts/{well_id:path}", response_model=ForecastResponse)
def get_well_forecast(well_id: str, horizon: int = 30):
    return generate_forecast(ForecastRequest(well_id=well_id, horizon_days=horizon))
