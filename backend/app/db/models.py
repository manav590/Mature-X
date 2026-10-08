from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Well(Base):
    __tablename__ = "wells"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    field = Column(String(100), default="Volve")
    well_type = Column(String(50), default="Producer") # Producer or Injector
    status = Column(String(50), default="Active")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    production_records = relationship("ProductionRecord", back_populates="well", cascade="all, delete-orphan")
    health = relationship("WellHealth", back_populates="well", uselist=False, cascade="all, delete-orphan")
    forecasts = relationship("Forecast", back_populates="well", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="well", cascade="all, delete-orphan")

class ProductionRecord(Base):
    __tablename__ = "production_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    well_id = Column(String(50), ForeignKey("wells.id"), index=True, nullable=False)
    date = Column(DateTime, index=True, nullable=False)
    oil_rate = Column(Float, default=0.0)
    water_rate = Column(Float, default=0.0)
    gas_rate = Column(Float, default=0.0)
    water_injection = Column(Float, default=0.0)
    pressure_bar = Column(Float, default=0.0)
    wellhead_pressure_bar = Column(Float, default=0.0)
    choke_pct = Column(Float, default=0.0)
    water_cut = Column(Float, default=0.0)

    well = relationship("Well", back_populates="production_records")

class WellHealth(Base):
    __tablename__ = "well_health"

    id = Column(Integer, primary_key=True, autoincrement=True)
    well_id = Column(String(50), ForeignKey("wells.id"), unique=True, index=True, nullable=False)
    cumulative_oil = Column(Float, default=0.0)
    avg_oil = Column(Float, default=0.0)
    latest_oil = Column(Float, default=0.0)
    latest_water_cut = Column(Float, default=0.0)
    latest_pressure = Column(Float, default=0.0)
    latest_choke = Column(Float, default=0.0)
    decline_pct = Column(Float, default=0.0)
    health_score = Column(Float, default=0.0)
    priority = Column(String(20), default="LOW") # HIGH, MEDIUM, LOW
    calculated_at = Column(DateTime, default=datetime.utcnow)

    well = relationship("Well", back_populates="health")

class Forecast(Base):
    __tablename__ = "forecasts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    well_id = Column(String(50), ForeignKey("wells.id"), index=True, nullable=False)
    horizon_days = Column(Integer, default=30)
    mae = Column(Float, nullable=True)
    mape = Column(Float, nullable=True)
    forecast_data = Column(JSON, nullable=True) # list of {date: str, forecast_oil: float}
    created_at = Column(DateTime, default=datetime.utcnow)

    well = relationship("Well", back_populates="forecasts")

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    well_id = Column(String(50), ForeignKey("wells.id"), index=True, nullable=False)
    choke_change_pct = Column(Float, default=0.0)
    injection_change_pct = Column(Float, default=0.0)
    base_oil = Column(Float, default=0.0)
    predicted_oil = Column(Float, default=0.0)
    predicted_water_cut = Column(Float, default=0.0)
    pressure = Column(Float, default=0.0)
    score = Column(Float, default=0.0)
    scenarios_json = Column(JSON, nullable=True) # full ranked scenarios list
    created_at = Column(DateTime, default=datetime.utcnow)

    well = relationship("Well", back_populates="recommendations")
