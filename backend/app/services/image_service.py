"""Image processing and storage service"""

import os
import uuid
import logging
from typing import Dict, Any, Optional, List
from PIL import Image
from fastapi import UploadFile

from ..config import Settings
from ..utils.exceptions import ImageProcessingException

logger = logging.getLogger(__name__)


class ImageService:
    """Service for image processing and storage"""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.upload_dir = settings.upload_dir
        os.makedirs(self.upload_dir, exist_ok=True)
    
    def is_ready(self) -> bool:
        """Check if service is ready"""
        return os.path.exists(self.upload_dir)
    
    async def process_upload(self, file: UploadFile, file_type: str, user: Optional[Dict] = None) -> Dict[str, Any]:
        """Process uploaded file"""
        try:
            # Generate unique filename
            file_id = str(uuid.uuid4())
            file_extension = os.path.splitext(file.filename)[1] if file.filename else '.jpg'
            filename = f"{file_id}{file_extension}"
            file_path = os.path.join(self.upload_dir, filename)
            
            # Save file
            content = await file.read()
            with open(file_path, "wb") as f:
                f.write(content)
            
            # Get image metadata
            with Image.open(file_path) as img:
                width, height = img.size
                format_name = img.format
            
            return {
                "id": file_id,
                "url": f"/api/uploads/{file_id}",
                "path": file_path,
                "type": file_type,
                "metadata": {
                    "size": len(content),
                    "format": format_name,
                    "width": width,
                    "height": height,
                    "quality": 85
                },
                "user_id": user.get("id") if user else None
            }
            
        except Exception as e:
            logger.error(f"Upload processing failed: {str(e)}")
            raise ImageProcessingException(f"Upload processing failed: {str(e)}")
    
    async def get_image_path(self, image_id: str) -> Optional[str]:
        """Get image file path by ID"""
        # In a real implementation, this would query the database
        # For now, we'll look for files with the ID as prefix
        for filename in os.listdir(self.upload_dir):
            if filename.startswith(image_id):
                return os.path.join(self.upload_dir, filename)
        return None
    
    async def get_image(self, image_id: str) -> Optional[Dict[str, Any]]:
        """Get image metadata by ID"""
        file_path = await self.get_image_path(image_id)
        if not file_path:
            return None
        
        return {
            "id": image_id,
            "path": file_path,
            "url": f"/api/uploads/{image_id}"
        }
    
    async def preprocess_image(self, image_path: str, image_type: str) -> str:
        """Preprocess image for AI processing"""
        try:
            with Image.open(image_path) as img:
                # Convert to RGB if necessary
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Resize if too large
                max_size = self.settings.max_image_dimension
                if img.width > max_size or img.height > max_size:
                    img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                
                # Save preprocessed image
                processed_filename = f"processed_{uuid.uuid4().hex}.jpg"
                processed_path = os.path.join(self.upload_dir, processed_filename)
                img.save(processed_path, 'JPEG', quality=self.settings.image_quality)
                
                return processed_path
                
        except Exception as e:
            logger.error(f"Image preprocessing failed: {str(e)}")
            return image_path  # Return original on failure
    
    async def get_try_on_result(self, try_on_id: str) -> Optional[Dict[str, Any]]:
        """Get try-on result by ID"""
        # Mock implementation - in production, query database
        return {
            "id": try_on_id,
            "status": "completed",
            "result_image": f"/api/uploads/result_{try_on_id}.jpg",
            "confidence": 0.92,
            "processing_time": 25
        }
    
    async def get_processing_status(self, try_on_id: str) -> Optional[Dict[str, Any]]:
        """Get processing status"""
        # Mock implementation
        return {
            "try_on_id": try_on_id,
            "stage": "completed",
            "progress": 100,
            "message": "Virtual try-on completed successfully!"
        }
    
    async def update_processing_status(self, try_on_id: str, stage: str, message: str):
        """Update processing status"""
        # Mock implementation - in production, update database
        logger.info(f"Try-on {try_on_id}: {stage} - {message}")
    
    async def save_try_on_result(self, try_on_id: str, result: Dict[str, Any]):
        """Save try-on result"""
        # Mock implementation - in production, save to database
        logger.info(f"Saved try-on result: {try_on_id}")
    
    async def get_user_history(self, user: Optional[Dict], limit: int = 10) -> List[Dict[str, Any]]:
        """Get user's try-on history"""
        # Mock implementation
        return []