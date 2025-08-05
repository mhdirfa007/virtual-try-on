"""Garment template and fabric management service"""

import logging
from typing import List, Optional, Dict, Any

logger = logging.getLogger(__name__)


class GarmentService:
    """Service for managing garment templates and fabrics"""
    
    def __init__(self):
        self._ready = True
        # Mock data - in production, this would come from database
        self.mock_templates = [
            {
                "id": "1",
                "name": "Classic Business Shirt",
                "category": "shirts",
                "type": "dress_shirt",
                "description": "Timeless professional shirt with perfect tailoring",
                "base_price": 89.0,
                "images": ["/static/templates/shirt1.jpg"],
                "customization_options": [],
                "available_sizes": [],
                "tags": ["business", "classic", "cotton"],
                "is_active": True
            },
            {
                "id": "2",
                "name": "Modern Slim Fit Suit",
                "category": "suits",
                "type": "two_piece_suit",
                "description": "Contemporary two-piece suit with modern cut",
                "base_price": 450.0,
                "images": ["/static/templates/suit1.jpg"],
                "customization_options": [],
                "available_sizes": [],
                "tags": ["modern", "slim", "formal"],
                "is_active": True
            },
            {
                "id": "3",
                "name": "Casual Chinos",
                "category": "trousers",
                "type": "chinos",
                "description": "Versatile chinos for smart-casual occasions",
                "base_price": 75.0,
                "images": ["/static/templates/chinos1.jpg"],
                "customization_options": [],
                "available_sizes": [],
                "tags": ["casual", "versatile", "cotton"],
                "is_active": True
            },
            {
                "id": "4",
                "name": "Premium Blazer",
                "category": "outerwear",
                "type": "blazer",
                "description": "Sophisticated blazer for business and social events",
                "base_price": 280.0,
                "images": ["/static/templates/blazer1.jpg"],
                "customization_options": [],
                "available_sizes": [],
                "tags": ["premium", "blazer", "wool"],
                "is_active": True
            }
        ]
        
        self.mock_fabrics = [
            {
                "id": "1",
                "name": "Premium Cotton",
                "type": "cotton",
                "composition": "100% Cotton",
                "weight": 120,
                "texture": "Smooth",
                "care": ["Machine wash", "Iron medium heat"],
                "colors": [
                    {"id": "1", "name": "White", "hex": "#FFFFFF", "rgb": [255, 255, 255]},
                    {"id": "2", "name": "Light Blue", "hex": "#ADD8E6", "rgb": [173, 216, 230]}
                ],
                "patterns": [
                    {"id": "1", "name": "Solid", "type": "solid", "image": "/static/patterns/solid.jpg"}
                ],
                "price_per_meter": 25.0,
                "images": ["/static/fabrics/cotton1.jpg"],
                "in_stock": True
            }
        ]
    
    def is_ready(self) -> bool:
        """Check if service is ready"""
        return self._ready
    
    async def get_templates(
        self, 
        category: Optional[str] = None, 
        limit: int = 20, 
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get garment templates"""
        try:
            templates = self.mock_templates
            
            # Filter by category
            if category:
                templates = [t for t in templates if t["category"] == category]
            
            # Apply pagination
            return templates[offset:offset + limit]
            
        except Exception as e:
            logger.error(f"Failed to get templates: {str(e)}")
            return []
    
    async def get_template(self, template_id: str) -> Optional[Dict[str, Any]]:
        """Get specific garment template"""
        try:
            for template in self.mock_templates:
                if template["id"] == template_id:
                    return template
            return None
            
        except Exception as e:
            logger.error(f"Failed to get template {template_id}: {str(e)}")
            return None
    
    async def get_fabrics(
        self, 
        fabric_type: Optional[str] = None, 
        limit: int = 20, 
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get available fabrics"""
        try:
            fabrics = self.mock_fabrics
            
            # Filter by type
            if fabric_type:
                fabrics = [f for f in fabrics if f["type"] == fabric_type]
            
            # Apply pagination
            return fabrics[offset:offset + limit]
            
        except Exception as e:
            logger.error(f"Failed to get fabrics: {str(e)}")
            return []
    
    async def get_fabric(self, fabric_id: str) -> Optional[Dict[str, Any]]:
        """Get specific fabric"""
        try:
            for fabric in self.mock_fabrics:
                if fabric["id"] == fabric_id:
                    return fabric
            return None
            
        except Exception as e:
            logger.error(f"Failed to get fabric {fabric_id}: {str(e)}")
            return None