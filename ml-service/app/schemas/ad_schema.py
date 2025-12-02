# File: app/schemas/ad_schema.py
"""
Purpose: Pydantic schemas for ad generation endpoints.
Handles validation for ad copy and image generation requests.
Professional playbook-driven ad generation.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from enum import Enum


class PlaybookEnum(str, Enum):
    """Available marketing playbooks."""
    FLASH_SALE = "Flash Sale"
    NEW_ARRIVAL = "New Arrival"
    BESTSELLER = "Best Seller Spotlight"
    BUNDLE = "Bundle Up!"


class AdCopyRequest(BaseModel):
    """Request schema for ad copy generation."""
    product_name: str = Field(
        ..., 
        min_length=1, 
        max_length=200,
        description="Product name",
        examples=["iPhone 15 Pro", "Nike Air Max 2024"]
    )
    playbook: str = Field(
        ..., 
        description="Marketing playbook/template",
        examples=["Flash Sale", "New Arrival", "Best Seller Spotlight", "Bundle Up!"]
    )
    discount: Optional[str] = Field(
        None, 
        description="Discount information (e.g., '50% OFF', '$10 OFF', 'Buy 1 Get 1')",
        examples=["50% OFF", "$20 OFF", "Buy 1 Get 1 Free"]
    )
    
    @field_validator('playbook')
    @classmethod
    def validate_playbook(cls, v: str) -> str:
        """Validate playbook is one of the supported types."""
        valid_playbooks = [p.value for p in PlaybookEnum]
        if v not in valid_playbooks:
            # Allow case-insensitive matching
            v_lower = v.lower()
            for valid in valid_playbooks:
                if valid.lower() == v_lower:
                    return valid
            raise ValueError(
                f"Invalid playbook. Must be one of: {', '.join(valid_playbooks)}"
            )
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "product_name": "Coca Cola 12-Pack",
                "playbook": "Flash Sale",
                "discount": "50% OFF"
            }
        }


class AdCopyResponse(BaseModel):
    """Response schema for ad copy generation."""
    ad_copy: str = Field(..., description="Generated ready-to-post ad copy")
    hashtags: List[str] = Field(
        default_factory=list, 
        description="Suggested hashtags (without # prefix)"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "ad_copy": "⚡🔥 LIMITED TIME OFFER! 🔥⚡\n\nGet 50% OFF on Coca Cola 12-Pack! Don't miss out - this deal won't last! ⏰\n\nShop now before it's gone! 💥",
                "hashtags": ["FlashSale", "LimitedTimeOffer", "DealAlert"]
            }
        }


class AdImageRequest(BaseModel):
    """Request schema for ad image generation."""
    product_name: str = Field(
        ..., 
        min_length=1,
        max_length=200,
        description="Product name",
        examples=["iPhone 15 Pro", "Nike Air Max"]
    )
    playbook: str = Field(
        ..., 
        description="Marketing playbook/template",
        examples=["Flash Sale", "New Arrival"]
    )
    style: Optional[str] = Field(
        None, 
        description="Additional style preference for image generation",
        examples=["minimalist", "vibrant", "luxury", "playful"]
    )
    discount: Optional[str] = Field(
        None,
        description="Discount to display on image",
        examples=["50% OFF", "$20 OFF"]
    )
    
    @field_validator('playbook')
    @classmethod
    def validate_playbook(cls, v: str) -> str:
        """Validate playbook is one of the supported types."""
        valid_playbooks = [p.value for p in PlaybookEnum]
        if v not in valid_playbooks:
            v_lower = v.lower()
            for valid in valid_playbooks:
                if valid.lower() == v_lower:
                    return valid
            raise ValueError(
                f"Invalid playbook. Must be one of: {', '.join(valid_playbooks)}"
            )
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "product_name": "Coca Cola 12-Pack",
                "playbook": "Flash Sale",
                "style": "vibrant",
                "discount": "50% OFF"
            }
        }


class AdImageResponse(BaseModel):
    """Response schema for ad image generation."""
    image_url: str = Field(
        ..., 
        description="Image URL (base64 data URL or external URL)"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "image_url": "data:image/png;base64,iVBORw0KGgo..."
            }
        }


class CompleteAdResponse(BaseModel):
    """Response schema for complete ad generation (copy + image)."""
    ad_copy: str = Field(..., description="Generated ready-to-post ad copy")
    hashtags: List[str] = Field(
        default_factory=list,
        description="Suggested hashtags"
    )
    image_url: str = Field(..., description="Generated ad image URL")
    
    class Config:
        json_schema_extra = {
            "example": {
                "ad_copy": "⚡🔥 LIMITED TIME! Get 50% OFF Coca Cola! 🔥⚡",
                "hashtags": ["FlashSale", "LimitedOffer", "ShopNow"],
                "image_url": "data:image/png;base64,..."
            }
        }

