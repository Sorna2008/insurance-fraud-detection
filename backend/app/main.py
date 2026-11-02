from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import settings
from .database import engine, Base, SessionLocal
from .models import *
from .services.claim_service import seed_initial_data_if_needed
from .api import auth, claims, predictions, investigations, analytics, documents

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables
    Base.metadata.create_all(bind=engine)
    # Seed synthetic demonstration data and default users
    db = SessionLocal()
    try:
        seed_initial_data_if_needed(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="AI-Powered Insurance Fraud Detection System",
    description=(
        "Production-grade REST API for Insurance Claim Fraud Prediction, "
        "Explainable AI (SHAP), Human-in-the-Loop Investigation Workflows, and Advanced Analytics."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(claims.router, prefix=settings.API_V1_STR)
app.include_router(predictions.router, prefix=settings.API_V1_STR)
app.include_router(investigations.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(documents.router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "api_version": "1.0.0",
        "ml_engine": "XGBoost + Isolation Forest + SHAP",
        "disclaimer": "Demonstration system using calibrated synthetic training records. Human oversight required."
    }
