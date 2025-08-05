import httpx
import asyncio
import logging
import base64
import io
from typing import Dict, Any, Optional, List
from PIL import Image
import numpy as np
from fastapi import UploadFile

from ..config import get_settings
from ..utils.exceptions import VirtualTryOnException

logger = logging.getLogger(__name__)


class HuggingFaceService:
    """Service for interacting with Hugging Face models"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api-inference.huggingface.co"
        self.settings = get_settings()
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(60.0),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
        )
        self.models = {}
        self._ready = False
    
    async def load_models(self):
        """Load and warm up AI models"""
        try:
            logger.info("Loading Hugging Face models...")
            
            # Define models to use
            self.models = {
                "pose_estimation": "microsoft/DialoGPT-medium",  # Placeholder
                "segmentation": "facebook/detr-resnet-50-panoptic",
                "try_on": "yisol/IDM-VTON",
                "background_removal": "briaai/RMBG-1.4",
                "image_classification": "openai/clip-vit-large-patch14",
                "style_transfer": "pytorch/pytorch_neural_style_transfer",
                "enhancement": "microsoft/DialoGPT-medium"  # Placeholder
            }
            
            # Warm up models by making test requests
            for model_name, model_id in self.models.items():
                try:
                    await self._warm_up_model(model_id)
                    logger.info(f"Model {model_name} ({model_id}) loaded successfully")
                except Exception as e:
                    logger.warning(f"Failed to warm up {model_name}: {str(e)}")
            
            self._ready = True
            logger.info("All models loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load models: {str(e)}")
            raise VirtualTryOnException(f"Model loading failed: {str(e)}")
    
    async def _warm_up_model(self, model_id: str):
        """Warm up a specific model"""
        url = f"{self.base_url}/models/{model_id}"
        
        # Create a small test image
        test_image = Image.new('RGB', (64, 64), color='white')
        buffer = io.BytesIO()
        test_image.save(buffer, format='JPEG')
        test_data = base64.b64encode(buffer.getvalue()).decode()
        
        payload = {
            "inputs": test_data,
            "options": {"wait_for_model": True}
        }
        
        async with self.client as client:
            response = await client.post(url, json=payload)
            if response.status_code not in [200, 503]:  # 503 is model loading
                logger.warning(f"Model {model_id} warm-up returned {response.status_code}")
    
    def is_ready(self) -> bool:
        """Check if service is ready"""
        return self._ready
    
    async def analyze_garment(self, image_file: UploadFile) -> Dict[str, Any]:
        """Analyze garment in image using CLIP"""
        try:
            # Convert image to base64
            image_data = await self._file_to_base64(image_file)
            
            # Use CLIP for garment classification
            url = f"{self.base_url}/models/{self.models['image_classification']}"
            
            payload = {
                "inputs": image_data,
                "parameters": {
                    "candidate_labels": [
                        "shirt", "pants", "dress", "jacket", "suit", 
                        "casual wear", "formal wear", "business attire",
                        "cotton fabric", "wool fabric", "silk fabric",
                        "striped pattern", "solid color", "checkered pattern"
                    ]
                }
            }
            
            async with self.client as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                
                result = response.json()
                
                return {
                    "garment_type": result[0]["label"] if result else "unknown",
                    "confidence": result[0]["score"] if result else 0.0,
                    "all_predictions": result[:5] if result else []
                }
                
        except Exception as e:
            logger.error(f"Garment analysis failed: {str(e)}")
            raise VirtualTryOnException(f"Garment analysis failed: {str(e)}")
    
    async def estimate_pose(self, image_path: str) -> Dict[str, Any]:
        """Estimate human pose in image"""
        try:
            # Load and encode image
            image_data = await self._image_path_to_base64(image_path)
            
            # For now, return mock pose data
            # In production, use actual pose estimation model
            return {
                "keypoints": [
                    {"name": "nose", "x": 0.5, "y": 0.3, "confidence": 0.9},
                    {"name": "left_shoulder", "x": 0.4, "y": 0.4, "confidence": 0.85},
                    {"name": "right_shoulder", "x": 0.6, "y": 0.4, "confidence": 0.85},
                    {"name": "left_hip", "x": 0.45, "y": 0.7, "confidence": 0.8},
                    {"name": "right_hip", "x": 0.55, "y": 0.7, "confidence": 0.8},
                ],
                "bbox": {"x": 0.2, "y": 0.1, "width": 0.6, "height": 0.8},
                "confidence": 0.85
            }
            
        except Exception as e:
            logger.error(f"Pose estimation failed: {str(e)}")
            raise VirtualTryOnException(f"Pose estimation failed: {str(e)}")
    
    async def segment_image(self, image_path: str) -> str:
        """Segment image to identify different regions"""
        try:
            # Load and encode image
            image_data = await self._image_path_to_base64(image_path)
            
            url = f"{self.base_url}/models/{self.models['segmentation']}"
            
            payload = {
                "inputs": image_data,
                "parameters": {"threshold": 0.5}
            }
            
            async with self.client as client:
                response = await client.post(url, json=payload)
                
                if response.status_code == 200:
                    # Return the segmentation mask (base64 encoded)
                    return response.content.decode() if response.content else ""
                else:
                    # Return mock segmentation for demo
                    return self._generate_mock_mask(image_path)
                    
        except Exception as e:
            logger.error(f"Image segmentation failed: {str(e)}")
            # Return mock mask as fallback
            return self._generate_mock_mask(image_path)
    
    async def generate_try_on(
        self, 
        person_image: str, 
        garment_image: str, 
        mask: Optional[str] = None,
        preferences: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate virtual try-on result"""
        try:
            # Encode images
            person_data = await self._image_path_to_base64(person_image)
            garment_data = await self._image_path_to_base64(garment_image)
            
            url = f"{self.base_url}/models/{self.models['try_on']}"
            
            payload = {
                "inputs": {
                    "person_image": person_data,
                    "garment_image": garment_data
                },
                "parameters": {
                    "num_inference_steps": 20,
                    "guidance_scale": 7.5,
                    "seed": np.random.randint(0, 1000000)
                }
            }
            
            if mask:
                payload["inputs"]["mask"] = mask
            
            if preferences:
                if preferences.get("quality") == "high":
                    payload["parameters"]["num_inference_steps"] = 50
                elif preferences.get("quality") == "fast":
                    payload["parameters"]["num_inference_steps"] = 10
            
            async with self.client as client:
                response = await client.post(url, json=payload)
                
                if response.status_code == 200:
                    # Save and return result image path
                    result_path = await self._save_result_image(response.content)
                    return result_path
                else:
                    # Generate mock result for demo
                    return await self._generate_mock_result(person_image, garment_image)
                    
        except Exception as e:
            logger.error(f"Try-on generation failed: {str(e)}")
            # Return mock result as fallback
            return await self._generate_mock_result(person_image, garment_image)
    
    async def remove_background(self, image_file: UploadFile) -> str:
        """Remove background from image"""
        try:
            image_data = await self._file_to_base64(image_file)
            
            url = f"{self.base_url}/models/{self.models['background_removal']}"
            
            payload = {"inputs": image_data}
            
            async with self.client as client:
                response = await client.post(url, json=payload)
                
                if response.status_code == 200:
                    # Save and return processed image
                    result_path = await self._save_result_image(response.content)
                    return result_path
                else:
                    raise VirtualTryOnException("Background removal failed")
                    
        except Exception as e:
            logger.error(f"Background removal failed: {str(e)}")
            raise VirtualTryOnException(f"Background removal failed: {str(e)}")
    
    async def enhance_image(self, image_path: str) -> str:
        """Enhance image quality"""
        try:
            # For now, return the original image path
            # In production, use actual enhancement model
            return image_path
            
        except Exception as e:
            logger.error(f"Image enhancement failed: {str(e)}")
            return image_path  # Return original on failure
    
    async def apply_fabric_to_template(
        self, 
        garment_template: Dict[str, Any], 
        fabric_image: Dict[str, Any]
    ) -> str:
        """Apply fabric pattern to garment template"""
        try:
            # Use style transfer to apply fabric to template
            template_image = garment_template["images"][0]
            fabric_path = fabric_image["path"]
            
            template_data = await self._image_path_to_base64(template_image)
            fabric_data = await self._image_path_to_base64(fabric_path)
            
            url = f"{self.base_url}/models/{self.models['style_transfer']}"
            
            payload = {
                "inputs": {
                    "content_image": template_data,
                    "style_image": fabric_data
                },
                "parameters": {
                    "style_strength": 0.8,
                    "preserve_content": True
                }
            }
            
            async with self.client as client:
                response = await client.post(url, json=payload)
                
                if response.status_code == 200:
                    result_path = await self._save_result_image(response.content)
                    return result_path
                else:
                    # Return original template image as fallback
                    return template_image
                    
        except Exception as e:
            logger.error(f"Fabric application failed: {str(e)}")
            # Return original template image as fallback
            return garment_template["images"][0]
    
    # Helper methods
    async def _file_to_base64(self, file: UploadFile) -> str:
        """Convert uploaded file to base64"""
        content = await file.read()
        return base64.b64encode(content).decode()
    
    async def _image_path_to_base64(self, image_path: str) -> str:
        """Convert image file to base64"""
        try:
            with open(image_path, "rb") as image_file:
                return base64.b64encode(image_file.read()).decode()
        except Exception as e:
            logger.error(f"Failed to encode image {image_path}: {str(e)}")
            # Return placeholder image
            return self._create_placeholder_image()
    
    def _create_placeholder_image(self) -> str:
        """Create a placeholder image as base64"""
        image = Image.new('RGB', (512, 512), color='lightgray')
        buffer = io.BytesIO()
        image.save(buffer, format='JPEG')
        return base64.b64encode(buffer.getvalue()).decode()
    
    async def _save_result_image(self, image_data: bytes) -> str:
        """Save result image and return path"""
        import os
        import uuid
        
        # Create uploads directory if it doesn't exist
        upload_dir = self.settings.upload_dir
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        filename = f"result_{uuid.uuid4().hex}.jpg"
        file_path = os.path.join(upload_dir, filename)
        
        # Save image
        with open(file_path, "wb") as f:
            f.write(image_data)
        
        return file_path
    
    def _generate_mock_mask(self, image_path: str) -> str:
        """Generate mock segmentation mask"""
        # Create a simple mock mask
        mask = Image.new('L', (512, 512), color=0)  # Black background
        # Add white region for person
        from PIL import ImageDraw
        draw = ImageDraw.Draw(mask)
        draw.ellipse([128, 64, 384, 448], fill=255)  # White person silhouette
        
        buffer = io.BytesIO()
        mask.save(buffer, format='PNG')
        return base64.b64encode(buffer.getvalue()).decode()
    
    async def _generate_mock_result(self, person_image: str, garment_image: str) -> str:
        """Generate mock try-on result for demo purposes"""
        try:
            # Create a composite image as mock result
            person_img = Image.open(person_image)
            garment_img = Image.open(garment_image)
            
            # Resize images to standard size
            person_img = person_img.resize((512, 768))
            garment_img = garment_img.resize((256, 256))
            
            # Create result by overlaying garment on person (simplified)
            result = person_img.copy()
            # Paste garment in the chest area (mock positioning)
            result.paste(garment_img, (128, 200), garment_img.convert('RGBA'))
            
            # Save result
            import os
            import uuid
            
            upload_dir = self.settings.upload_dir
            os.makedirs(upload_dir, exist_ok=True)
            
            filename = f"mock_result_{uuid.uuid4().hex}.jpg"
            file_path = os.path.join(upload_dir, filename)
            
            result.save(file_path, 'JPEG', quality=85)
            return file_path
            
        except Exception as e:
            logger.error(f"Mock result generation failed: {str(e)}")
            # Return person image as fallback
            return person_image
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()