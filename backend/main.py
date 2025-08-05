from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import uvicorn
import os
import asyncio
import logging
from typing import List, Optional, Dict, Any
import json
from datetime import datetime, timedelta
import uuid

from app.config import get_settings
from app.models import (
    TryOnRequest, TryOnResponse, GarmentTemplate, 
    UploadResponse, ProcessingStatus, QualityMetrics
)
from app.services.huggingface_service import HuggingFaceService
from app.services.image_service import ImageService
from app.services.garment_service import GarmentService
from app.utils.exceptions import VirtualTryOnException
from app.utils.auth import get_current_user
from app.database import init_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global services
hf_service = None
image_service = None
garment_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    global hf_service, image_service, garment_service
    
    logger.info("Starting Virtual Try-On API...")
    
    # Initialize database
    await init_db()
    
    # Initialize services
    settings = get_settings()
    hf_service = HuggingFaceService(settings.huggingface_api_key)
    image_service = ImageService(settings)
    garment_service = GarmentService()
    
    # Load models
    await hf_service.load_models()
    
    logger.info("Virtual Try-On API started successfully!")
    
    yield
    
    logger.info("Shutting down Virtual Try-On API...")

# Create FastAPI app
app = FastAPI(
    title="Virtual Try-On API",
    description="AI-powered virtual try-on service for tailored clothing",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://virtual-try-on.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Virtual Try-On API",
        "version": "1.0.0",
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "services": {
            "huggingface": hf_service.is_ready() if hf_service else False,
            "image_processing": image_service.is_ready() if image_service else False,
            "garment_service": garment_service.is_ready() if garment_service else False,
        },
        "timestamp": datetime.utcnow().isoformat()
    }

# Image Upload Endpoints
@app.post("/api/upload", response_model=UploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    type: str = Form(...),
    current_user: Optional[Dict] = Depends(get_current_user)
):
    """Upload and process user image or fabric sample"""
    try:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        if file.size > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=400, detail="File size too large")
        
        # Process and save image
        result = await image_service.process_upload(file, type, current_user)
        
        return UploadResponse(
            success=True,
            data=result,
            message="Image uploaded successfully"
        )
        
    except VirtualTryOnException as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/uploads/{image_id}")
async def get_uploaded_image(image_id: str):
    """Get uploaded image by ID"""
    try:
        image_path = await image_service.get_image_path(image_id)
        if not image_path or not os.path.exists(image_path):
            raise HTTPException(status_code=404, detail="Image not found")
        
        return FileResponse(image_path)
        
    except Exception as e:
        logger.error(f"Get image error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Garment Template Endpoints
@app.get("/api/garments", response_model=List[GarmentTemplate])
async def get_garment_templates(
    category: Optional[str] = None,
    limit: int = 20,
    offset: int = 0
):
    """Get available garment templates"""
    try:
        templates = await garment_service.get_templates(category, limit, offset)
        return templates
        
    except Exception as e:
        logger.error(f"Get templates error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/garments/{template_id}", response_model=GarmentTemplate)
async def get_garment_template(template_id: str):
    """Get specific garment template"""
    try:
        template = await garment_service.get_template(template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        return template
        
    except Exception as e:
        logger.error(f"Get template error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Virtual Try-On Endpoints
@app.post("/api/try-on", response_model=TryOnResponse)
async def create_try_on(
    request: TryOnRequest,
    current_user: Optional[Dict] = Depends(get_current_user)
):
    """Create virtual try-on request"""
    try:
        # Validate request
        if not request.user_image_id or not request.garment_template_id:
            raise HTTPException(
                status_code=400, 
                detail="User image and garment template are required"
            )
        
        # Get user image
        user_image = await image_service.get_image(request.user_image_id)
        if not user_image:
            raise HTTPException(status_code=404, detail="User image not found")
        
        # Get garment template
        garment_template = await garment_service.get_template(request.garment_template_id)
        if not garment_template:
            raise HTTPException(status_code=404, detail="Garment template not found")
        
        # Process fabric if provided
        fabric_image = None
        if request.fabric_image_id:
            fabric_image = await image_service.get_image(request.fabric_image_id)
        
        # Create try-on request
        try_on_id = str(uuid.uuid4())
        
        # Start async processing
        task = asyncio.create_task(
            process_try_on(
                try_on_id=try_on_id,
                user_image=user_image,
                garment_template=garment_template,
                fabric_image=fabric_image,
                preferences=request.preferences,
                user=current_user
            )
        )
        
        return TryOnResponse(
            success=True,
            data={
                "try_on_id": try_on_id,
                "status": "processing",
                "estimated_time": 30,
                "message": "Virtual try-on is being processed"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Try-on creation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/try-on/{try_on_id}", response_model=TryOnResponse)
async def get_try_on_result(try_on_id: str):
    """Get try-on result by ID"""
    try:
        result = await image_service.get_try_on_result(try_on_id)
        if not result:
            raise HTTPException(status_code=404, detail="Try-on result not found")
        
        return TryOnResponse(
            success=True,
            data=result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get try-on result error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/try-on/{try_on_id}/status", response_model=ProcessingStatus)
async def get_try_on_status(try_on_id: str):
    """Get try-on processing status"""
    try:
        status = await image_service.get_processing_status(try_on_id)
        if not status:
            raise HTTPException(status_code=404, detail="Try-on not found")
        
        return status
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get try-on status error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/try-on/history", response_model=List[Dict])
async def get_try_on_history(
    limit: int = 10,
    current_user: Optional[Dict] = Depends(get_current_user)
):
    """Get user's try-on history"""
    try:
        history = await image_service.get_user_history(current_user, limit)
        return history
        
    except Exception as e:
        logger.error(f"Get history error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Fabric Endpoints
@app.get("/api/fabrics")
async def get_fabrics(
    type: Optional[str] = None,
    limit: int = 20,
    offset: int = 0
):
    """Get available fabric options"""
    try:
        fabrics = await garment_service.get_fabrics(type, limit, offset)
        return {"success": True, "data": fabrics}
        
    except Exception as e:
        logger.error(f"Get fabrics error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Utility Endpoints
@app.post("/api/analyze-image")
async def analyze_image(
    file: UploadFile = File(...),
    current_user: Optional[Dict] = Depends(get_current_user)
):
    """Analyze uploaded image for garment detection"""
    try:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Process image with Hugging Face
        analysis = await hf_service.analyze_garment(file)
        
        return {
            "success": True,
            "data": analysis
        }
        
    except Exception as e:
        logger.error(f"Image analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/remove-background")
async def remove_background(
    file: UploadFile = File(...),
    current_user: Optional[Dict] = Depends(get_current_user)
):
    """Remove background from uploaded image"""
    try:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Process with Hugging Face
        result = await hf_service.remove_background(file)
        
        return {
            "success": True,
            "data": {"processed_image": result}
        }
        
    except Exception as e:
        logger.error(f"Background removal error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Processing function
async def process_try_on(
    try_on_id: str,
    user_image: Dict,
    garment_template: Dict,
    fabric_image: Optional[Dict],
    preferences: Dict,
    user: Optional[Dict]
):
    """Process virtual try-on asynchronously"""
    try:
        logger.info(f"Starting try-on processing: {try_on_id}")
        
        # Update status
        await image_service.update_processing_status(
            try_on_id, "preprocessing", "Preprocessing images..."
        )
        
        # Step 1: Preprocess images
        processed_user_image = await image_service.preprocess_image(
            user_image["path"], "user_photo"
        )
        
        # Step 2: Generate garment image
        if fabric_image:
            # Apply fabric to template
            garment_image = await hf_service.apply_fabric_to_template(
                garment_template, fabric_image
            )
        else:
            # Use template image
            garment_image = garment_template["images"][0]
        
        # Update status
        await image_service.update_processing_status(
            try_on_id, "pose_estimation", "Analyzing body pose..."
        )
        
        # Step 3: Pose estimation
        pose_data = await hf_service.estimate_pose(processed_user_image)
        
        # Update status
        await image_service.update_processing_status(
            try_on_id, "segmentation", "Segmenting garment areas..."
        )
        
        # Step 4: Image segmentation
        segmentation_mask = await hf_service.segment_image(processed_user_image)
        
        # Update status
        await image_service.update_processing_status(
            try_on_id, "generation", "Generating virtual try-on..."
        )
        
        # Step 5: Generate virtual try-on
        result_image = await hf_service.generate_try_on(
            person_image=processed_user_image,
            garment_image=garment_image,
            mask=segmentation_mask,
            preferences=preferences
        )
        
        # Step 6: Post-processing and quality analysis
        await image_service.update_processing_status(
            try_on_id, "postprocessing", "Enhancing result quality..."
        )
        
        # Enhance result
        enhanced_result = await hf_service.enhance_image(result_image)
        
        # Calculate quality metrics
        quality_metrics = await calculate_quality_metrics(
            processed_user_image, enhanced_result, garment_image
        )
        
        # Generate variations
        variations = await generate_variations(enhanced_result, preferences)
        
        # Save final result
        final_result = {
            "id": try_on_id,
            "result_image": enhanced_result,
            "confidence": quality_metrics.get("overall_score", 0.8),
            "processing_time": 25,  # Calculate actual time
            "quality_metrics": quality_metrics,
            "variations": variations,
            "created_at": datetime.utcnow().isoformat(),
            "user_id": user.get("id") if user else None
        }
        
        await image_service.save_try_on_result(try_on_id, final_result)
        
        # Update final status
        await image_service.update_processing_status(
            try_on_id, "completed", "Virtual try-on completed successfully!"
        )
        
        logger.info(f"Try-on processing completed: {try_on_id}")
        
    except Exception as e:
        logger.error(f"Try-on processing error: {str(e)}")
        await image_service.update_processing_status(
            try_on_id, "failed", f"Processing failed: {str(e)}"
        )

async def calculate_quality_metrics(user_image: str, result_image: str, garment_image: str) -> Dict[str, float]:
    """Calculate quality metrics for the try-on result"""
    # Mock implementation - in production, use actual ML models
    return {
        "realism": 0.89,
        "fit_accuracy": 0.94,
        "color_accuracy": 0.91,
        "texture_quality": 0.88,
        "overall_score": 0.91
    }

async def generate_variations(result_image: str, preferences: Dict) -> List[Dict]:
    """Generate style variations of the try-on result"""
    # Mock implementation - in production, generate actual variations
    return [
        {
            "id": str(uuid.uuid4()),
            "type": "lighting",
            "image": result_image,
            "description": "Natural lighting"
        },
        {
            "id": str(uuid.uuid4()),
            "type": "lighting", 
            "image": result_image,
            "description": "Studio lighting"
        }
    ]

# Error handlers
@app.exception_handler(VirtualTryOnException)
async def virtual_try_on_exception_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content={"success": False, "error": str(exc)}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal server error"}
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )