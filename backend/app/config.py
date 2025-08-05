from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # API Configuration
    app_name: str = "Virtual Try-On API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Security
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Hugging Face Configuration
    huggingface_api_key: str
    huggingface_base_url: str = "https://api-inference.huggingface.co"
    
    # Database Configuration
    database_url: str = "sqlite:///./virtual_try_on.db"
    
    # Redis Configuration (for caching and task queue)
    redis_url: str = "redis://localhost:6379"
    
    # File Storage Configuration
    upload_dir: str = "uploads"
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_extensions: list = [".jpg", ".jpeg", ".png", ".webp"]
    
    # Image Processing Configuration
    image_quality: int = 85
    max_image_dimension: int = 2048
    thumbnail_size: tuple = (300, 400)
    
    # Cloud Storage (optional)
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_s3_bucket: Optional[str] = None
    aws_region: str = "us-east-1"
    
    cloudinary_cloud_name: Optional[str] = None
    cloudinary_api_key: Optional[str] = None
    cloudinary_api_secret: Optional[str] = None
    
    # AI Model Configuration
    default_model_timeout: int = 60
    max_concurrent_requests: int = 10
    model_cache_size: int = 100
    
    # Monitoring and Logging
    log_level: str = "INFO"
    sentry_dsn: Optional[str] = None
    
    # Rate Limiting
    rate_limit_per_minute: int = 60
    rate_limit_burst: int = 10
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
_settings = None


def get_settings() -> Settings:
    """Get application settings (singleton pattern)"""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings


# Environment-specific configurations
class DevelopmentSettings(Settings):
    """Development environment settings"""
    debug: bool = True
    log_level: str = "DEBUG"
    database_url: str = "sqlite:///./dev_virtual_try_on.db"


class ProductionSettings(Settings):
    """Production environment settings"""
    debug: bool = False
    log_level: str = "WARNING"
    # Use PostgreSQL in production
    database_url: str = "postgresql://user:password@localhost/virtual_try_on"


class TestingSettings(Settings):
    """Testing environment settings"""
    debug: bool = True
    log_level: str = "DEBUG"
    database_url: str = "sqlite:///./test_virtual_try_on.db"


def get_settings_for_env(env: str = None) -> Settings:
    """Get settings for specific environment"""
    if env is None:
        env = os.getenv("ENVIRONMENT", "development")
    
    if env == "production":
        return ProductionSettings()
    elif env == "testing":
        return TestingSettings()
    else:
        return DevelopmentSettings()