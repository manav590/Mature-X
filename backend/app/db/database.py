import os
import logging
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

# Load .env file
load_dotenv()

logger = logging.getLogger("maturex.db")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./maturex.db")

def get_engine():
    global DATABASE_URL
    try:
        if DATABASE_URL.startswith("sqlite"):
            return create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
        else:
            # Try connecting to MySQL
            engine = create_engine(DATABASE_URL, pool_pre_ping=True)
            with engine.connect() as conn:
                pass
            return engine
    except Exception as e:
        logger.warning(f"Could not connect to configured DATABASE_URL ({DATABASE_URL}): {e}. Falling back to SQLite.")
        sqlite_url = "sqlite:///./maturex.db"
        return create_engine(sqlite_url, connect_args={"check_same_thread": False})

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
