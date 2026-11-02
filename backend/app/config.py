import os

class Settings:
    PROJECT_NAME: str = "AI-Powered Insurance Fraud Detection System"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "insurance-fraud-detection-super-secret-key-2026-xgb-shap")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Defaults to local SQLite for instant out-of-the-box local testing,
    # or connects to PostgreSQL when DATABASE_URL is configured
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./fraud_detection.db")
    
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    MODELS_DIR: str = os.path.join(BASE_DIR, "models")
    DATASET_DIR: str = os.path.join(BASE_DIR, "dataset")
    UPLOADS_DIR: str = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")

settings = Settings()
