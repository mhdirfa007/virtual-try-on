from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum


# Enums
class GarmentCategory(str, Enum):
    SHIRTS = "shirts"
    SUITS = "suits"
    TROUSERS = "trousers"
    OUTERWEAR = "outerwear"
    ACCESSORIES = "accessories"


class GarmentType(str, Enum):
    DRESS_SHIRT = "dress_shirt"
    CASUAL_SHIRT = "casual_shirt"
    POLO_SHIRT = "polo_shirt"
    T_SHIRT = "t_shirt"
    TWO_PIECE_SUIT = "two_piece_suit"
    THREE_PIECE_SUIT = "three_piece_suit"
    BLAZER = "blazer"
    WAISTCOAT = "waistcoat"
    FORMAL_PANTS = "formal_pants"
    CHINOS = "chinos"
    JEANS = "jeans"
    COAT = "coat"
    JACKET = "jacket"
    VEST = "vest"
    TIE = "tie"
    POCKET_SQUARE = "pocket_square"
    CUFFLINKS = "cufflinks"


class FabricType(str, Enum):
    COTTON = "cotton"
    WOOL = "wool"
    SILK = "silk"
    LINEN = "linen"
    POLYESTER = "polyester"
    BLEND = "blend"
    CASHMERE = "cashmere"
    TWEED = "tweed"
    DENIM = "denim"


class ProcessingStage(str, Enum):
    QUEUED = "queued"
    PREPROCESSING = "preprocessing"
    POSE_ESTIMATION = "pose_estimation"
    SEGMENTATION = "segmentation"
    GENERATION = "generation"
    POSTPROCESSING = "postprocessing"
    COMPLETED = "completed"
    FAILED = "failed"


# Base Models
class BaseResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ErrorResponse(BaseResponse):
    success: bool = False
    error: str
    details: Optional[Dict[str, Any]] = None


# Image Models
class ImageMetadata(BaseModel):
    size: int
    format: str
    width: int
    height: int
    quality: Optional[int] = None
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None


class UploadedImage(BaseModel):
    id: str
    url: str
    type: str  # 'user_photo' or 'fabric_sample'
    metadata: ImageMetadata
    user_id: Optional[str] = None


class UploadResponse(BaseResponse):
    data: UploadedImage


# Garment Models
class CustomizationOption(BaseModel):
    id: str
    name: str
    type: str  # 'color', 'fabric', 'style', 'fit', 'details'
    options: List[Dict[str, Any]]
    default_value: str
    price_modifier: float = 0.0


class Size(BaseModel):
    id: str
    label: str
    measurements: Dict[str, float]


class GarmentTemplate(BaseModel):
    id: str
    name: str
    category: GarmentCategory
    type: GarmentType
    description: str
    base_price: float
    images: List[str]
    customization_options: List[CustomizationOption] = []
    available_sizes: List[Size] = []
    tags: List[str] = []
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


# Fabric Models
class FabricColor(BaseModel):
    id: str
    name: str
    hex: str
    rgb: List[int] = Field(..., min_items=3, max_items=3)

    @validator('rgb')
    def validate_rgb(cls, v):
        if not all(0 <= val <= 255 for val in v):
            raise ValueError('RGB values must be between 0 and 255')
        return v


class FabricPattern(BaseModel):
    id: str
    name: str
    type: str  # 'solid', 'stripe', 'check', 'plaid', etc.
    image: str


class Fabric(BaseModel):
    id: str
    name: str
    type: FabricType
    composition: str
    weight: float
    texture: str
    care: List[str]
    colors: List[FabricColor]
    patterns: List[FabricPattern]
    price_per_meter: float
    images: List[str]
    in_stock: bool = True


# Try-On Models
class TryOnPreferences(BaseModel):
    lighting: str = "natural"  # 'natural', 'studio', 'indoor', 'outdoor'
    pose: str = "front"  # 'front', 'side', 'three_quarter'
    background: str = "original"  # 'transparent', 'neutral', 'original'
    quality: str = "balanced"  # 'fast', 'balanced', 'high'


class TryOnRequest(BaseModel):
    user_image_id: str
    garment_template_id: str
    fabric_image_id: Optional[str] = None
    customizations: Dict[str, str] = {}
    preferences: TryOnPreferences = Field(default_factory=TryOnPreferences)


class ProcessingStep(BaseModel):
    step: str
    duration: float
    success: bool
    details: Optional[str] = None


class QualityMetrics(BaseModel):
    realism: float = Field(..., ge=0, le=1)
    fit_accuracy: float = Field(..., ge=0, le=1)
    color_accuracy: float = Field(..., ge=0, le=1)
    texture_quality: float = Field(..., ge=0, le=1)
    overall_score: float = Field(..., ge=0, le=1)


class TryOnMetadata(BaseModel):
    model_used: str
    processing_steps: List[ProcessingStep]
    quality_metrics: QualityMetrics
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class TryOnVariation(BaseModel):
    id: str
    type: str  # 'lighting', 'pose', 'fit'
    image: str
    description: str


class TryOnResult(BaseModel):
    id: str
    request_id: str
    result_image: str
    confidence: float = Field(..., ge=0, le=1)
    processing_time: float
    metadata: TryOnMetadata
    variations: Optional[List[TryOnVariation]] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: Optional[str] = None


class TryOnResponse(BaseResponse):
    data: Union[TryOnResult, Dict[str, Any]]


class ProcessingStatus(BaseModel):
    try_on_id: str
    stage: ProcessingStage
    progress: float = Field(..., ge=0, le=100)
    message: str
    estimated_completion: Optional[datetime] = None
    error: Optional[str] = None


# User Models
class UserPreferences(BaseModel):
    favorite_styles: List[str] = []
    preferred_fit: str = "regular"  # 'slim', 'regular', 'relaxed'
    color_preferences: List[str] = []
    fabric_preferences: List[str] = []


class BodyMeasurements(BaseModel):
    chest: Optional[float] = None
    waist: Optional[float] = None
    hips: Optional[float] = None
    shoulders: Optional[float] = None
    arm_length: Optional[float] = None
    inseam: Optional[float] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    units: str = "metric"  # 'metric' or 'imperial'


class User(BaseModel):
    id: str
    email: Optional[str] = None
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    measurements: Optional[BodyMeasurements] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_active: Optional[datetime] = None
    is_active: bool = True


# Authentication Models
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None


# Analytics Models
class UsageStats(BaseModel):
    total_uploads: int
    total_try_ons: int
    successful_try_ons: int
    average_processing_time: float
    popular_garments: List[Dict[str, Any]]
    user_satisfaction: Optional[float] = None


class SystemMetrics(BaseModel):
    api_health: str
    active_users: int
    processing_queue_size: int
    average_response_time: float
    error_rate: float
    uptime: float


# Webhook Models
class WebhookEvent(BaseModel):
    event_type: str
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    signature: Optional[str] = None


# Batch Processing Models
class BatchTryOnRequest(BaseModel):
    requests: List[TryOnRequest]
    priority: str = "normal"  # 'low', 'normal', 'high'
    callback_url: Optional[str] = None


class BatchTryOnResponse(BaseResponse):
    batch_id: str
    total_requests: int
    estimated_completion: datetime


# Configuration Models
class ModelConfig(BaseModel):
    name: str
    version: str
    parameters: Dict[str, Any]
    is_active: bool = True
    performance_metrics: Optional[Dict[str, float]] = None


class APIConfig(BaseModel):
    rate_limits: Dict[str, int]
    allowed_origins: List[str]
    max_file_size: int
    supported_formats: List[str]
    default_quality: str


# Export all models
__all__ = [
    "BaseResponse",
    "ErrorResponse",
    "UploadedImage",
    "UploadResponse",
    "GarmentTemplate",
    "Fabric",
    "TryOnRequest",
    "TryOnResponse",
    "TryOnResult",
    "ProcessingStatus",
    "QualityMetrics",
    "User",
    "Token",
    "UsageStats",
    "SystemMetrics",
    "GarmentCategory",
    "GarmentType",
    "FabricType",
    "ProcessingStage",
]