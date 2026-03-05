from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
import app.models # Important: Import models before create_all so metadata is populated

# Create tables for SQLite (In production, use Alembic migrations)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Dropship Admin API",
    description="Backend API for managing dropshipping products and parsing Wildberries.",
    version="1.0.0",
)

# Allow CORS for local React development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "API is running"}

from app.api import api_router
app.include_router(api_router, prefix="/api/v1")
