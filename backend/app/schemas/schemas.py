from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ProductionPoint(BaseModel):
    date: str
    oil_rate: float
    water_rate: float
    gas_rate: float
    water_injection: float
    pressure_bar: float
    choke_pct: float
    water_cut: float

class WellHealthSchema(BaseModel):
    well_id: str
    cumulative_oil: float
    avg_oil: float
    latest_oil: float
    latest_water_cut: float
    latest_pressure: float
    latest_choke: float
    decline_pct: float
    health_score: float
    priority: str

class WellItem(BaseModel):
    id: str
    name: str
    field: str
    status: str
    well_type: str
    health_score: float
    priority: str
    latest_oil: float
    latest_water_cut: float
    cumulative_oil: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class WellDetail(BaseModel):
    id: str
    name: str
    field: str
    status: str
    well_type: str
    health: WellHealthSchema
    history: List[ProductionPoint]

class ForecastPoint(BaseModel):
    date: str
    forecast_oil: float

class ForecastRequest(BaseModel):
    well_id: str
    horizon_days: int = Field(default=30, ge=7, le=90)

class ForecastResponse(BaseModel):
    well_id: str
    horizon_days: int
    mae: Optional[float] = None
    mape: Optional[float] = None
    forecast: List[ForecastPoint]

class ScenarioItem(BaseModel):
    choke_change_pct: float
    injection_change_pct: float
    predicted_oil: float
    oil_gain_pct: float
    predicted_water_cut: float
    water_cut_pct: float
    pressure: float
    score: float

class OptimizeRequest(BaseModel):
    well_id: str

class OptimizeResponse(BaseModel):
    well_id: str
    base_oil: float
    base_water_cut: float
    base_pressure: float
    recommended_scenario: ScenarioItem
    scenarios: List[ScenarioItem]
    caption: str

class FieldSummaryResponse(BaseModel):
    total_wells: int
    active_producers: int
    total_cumulative_oil: float
    total_cumulative_water: float
    total_cumulative_gas: float
    peak_oil_rate: float
    data_mode: str
    daily_history: List[Dict[str, Any]]
