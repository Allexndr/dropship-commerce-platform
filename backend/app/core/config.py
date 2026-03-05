import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Dropship Admin API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # We will use SQLite for initial dev, then swap to PostGres
    # To use postgres: "postgresql://user:password@localhost/dropship_db"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./dropship.db")
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-for-jwt-dev-only")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    class Config:
        env_file = ".env"

settings = Settings()
