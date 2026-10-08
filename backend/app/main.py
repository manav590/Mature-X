import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db.database import engine, Base
from .api import wells, forecast, optimization
from .services.maturex.data import load_data
from .services.maturex.surrogate import build_surrogate

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("maturex.main")

# Create database tables if they do not exist
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
except Exception as e:
    logger.warning(f"Could not initialize database tables: {e}")

app = FastAPI(
    title="MATURE-X API",
    description="AI-Assisted Mature-Field Production Optimization & Decision Support REST API",
    version="1.0.0"
)

# CORS configuration
cors_origins_env = os.getenv("CORS_ALLOWED_ORIGINS", "*")
origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
if not origins or "*" in origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(wells.router)
app.include_router(forecast.router)
app.include_router(optimization.router)

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "MATURE-X API",
        "version": "1.0.0",
        "mode": "Active"
    }

@app.on_event("startup")
def startup_preload():
    logger.info("Preloading Mature-X dataset and surrogate model into memory...")
    try:
        df = load_data()
        logger.info(f"Preloaded dataset: {len(df)} rows.")
        build_surrogate(df)
        logger.info("Preloaded surrogate model successfully.")
    except Exception as e:
        logger.error(f"Startup preload failed: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
