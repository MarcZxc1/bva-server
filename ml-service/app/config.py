# File: app/config.py
"""
Purpose: Centralized configuration management using pydantic-settings.
Loads environment variables and provides typed access to configuration values.
Ensures all credentials and deployment-specific settings are externalized.

Key features:
- Type-safe configuration with validation
- Support for .env files in development
- Separate settings for Redis, Celery, model paths, and API behavior
"""

from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    All sensitive values (Redis URL, API keys) must be provided via environment.
    Sensible defaults are provided for development.
    """
    
    # Application
    APP_NAME: str = "SmartShelf ML Service"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4
    
    # API Configuration
    API_V1_PREFIX: str = "/api/v1"
    MAX_PAYLOAD_ROWS: int = 100000  # Prevent excessive payloads
    
    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_TTL: int = 86400  # 24 hours in seconds
    
    # Celery Configuration
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"
    CELERY_TIMEZONE: str = "UTC"
    
    # Model Configuration
    MODEL_DIR: str = "./models"
    MODEL_CACHE_DAYS: int = 7  # Retrain if model older than this
    DEFAULT_FORECAST_PERIODS: int = 14
    DEFAULT_FORECAST_METHOD: str = "auto"
    
    # Forecast parameters
    FORECAST_MIN_HISTORY_DAYS: int = 14  # Minimum history to train
    FORECAST_CONFIDENCE_INTERVAL: float = 0.95
    
    # Inventory thresholds (defaults - overridable per request)
    DEFAULT_LOW_STOCK_THRESHOLD: int = 10
    DEFAULT_EXPIRY_WARNING_DAYS: int = 7
    DEFAULT_SLOW_MOVING_WINDOW_DAYS: int = 30
    DEFAULT_SLOW_MOVING_THRESHOLD: float = 0.5  # units/day
    
    # Promotion generation
    DEFAULT_MAX_DISCOUNT_PCT: float = 40.0
    DEFAULT_MIN_MARGIN_PCT: float = 10.0
    PROMOTION_ELASTICITY_MULTIPLIER: float = 2.0  # Demand increase per % discount
    
    # Backend callback (optional)
    BACKEND_API_URL: Optional[str] = None
    BACKEND_API_KEY: Optional[str] = None
    
    # Google Gemini API
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.0-flash-exp"
    IMAGEN_MODEL: str = "gemini-2.0-flash-exp"  # For image generation - Note: Gemini doesn't support native image generation yet
    
    # Social Media APIs
    FACEBOOK_ACCESS_TOKEN: Optional[str] = None
    INSTAGRAM_ACCESS_TOKEN: Optional[str] = None
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"  # 'json' or 'console'
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


# Singleton instance
settings = Settings()
