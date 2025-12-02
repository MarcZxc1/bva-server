# File: app/schemas/social_media_schema.py
"""
Purpose: Pydantic schemas for social media posting endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class SocialMediaPostRequest(BaseModel):
    """Request to post generated ad to social media."""
    product_name: str = Field(..., description="Product name")
    playbook: str = Field(..., description="Marketing playbook")
    discount: Optional[str] = Field(None, description="Discount information")
    
    # Social media targeting
    post_to_facebook: bool = Field(True, description="Post to Facebook")
    post_to_instagram: bool = Field(True, description="Post to Instagram")
    
    # Account IDs
    facebook_page_id: Optional[str] = Field(None, description="Facebook Page ID")
    instagram_account_id: Optional[str] = Field(None, description="Instagram Business Account ID")
    
    # Scheduling
    schedule_time: Optional[datetime] = Field(None, description="Schedule post for later")
    
    class Config:
        json_schema_extra = {
            "example": {
                "product_name": "iPhone 15 Pro",
                "playbook": "Flash Sale",
                "discount": "50% OFF",
                "post_to_facebook": True,
                "post_to_instagram": True,
                "facebook_page_id": "123456789",
                "instagram_account_id": "987654321"
            }
        }


class SocialMediaPostResponse(BaseModel):
    """Response from social media posting."""
    success: bool
    posted_to: int = Field(..., description="Number of platforms posted to")
    total_platforms: int
    results: dict = Field(..., description="Results from each platform")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "posted_to": 2,
                "total_platforms": 2,
                "results": {
                    "facebook": {
                        "success": True,
                        "post_id": "123456789_987654321",
                        "post_url": "https://facebook.com/123456789_987654321"
                    },
                    "instagram": {
                        "success": True,
                        "post_id": "abc123xyz",
                        "post_url": "https://instagram.com/p/abc123xyz"
                    }
                }
            }
        }
