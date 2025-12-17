# File: app/routes/ads.py
"""
Purpose: FastAPI routes for MarketMate ad generation endpoints.
Professional playbook-driven ad generation using Google Gemini 2.0 Flash.

Endpoints:
- POST /generate: Generate complete ad content (copy + image)
- POST /generate-copy: Generate AI-powered ad copy only
- POST /generate-image: Generate AI-powered ad images only
"""

from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any
import structlog
from app.schemas.ad_schema import (
    AdCopyRequest,
    AdCopyResponse,
    AdImageRequest,
    AdImageResponse
)
from app.schemas.social_media_schema import (
    SocialMediaPostRequest,
    SocialMediaPostResponse
)
from app.services.ad_service import ad_service
from app.services.social_media_service import social_media_service
from app.config import settings

logger = structlog.get_logger()

router = APIRouter(prefix="/ads", tags=["MarketMate Ad Generation"])


@router.get("/models")
async def get_model_info():
    """
    Get information about the AI models being used for ad generation.
    
    Returns:
        Dictionary with model names for ad copy and image generation
    """
    return {
        "ad_copy_model": settings.GEMINI_MODEL,
        "image_generation_model": settings.IMAGEN_MODEL,
        "gemini_configured": ad_service.gemini_configured,
        "description": {
            "ad_copy_model": "Used for generating ad copy, headlines, and marketing text",
            "image_generation_model": "Used for generating marketing images and ad visuals"
        }
    }


@router.post("/generate")
async def generate_complete_ad(request: AdCopyRequest) -> Dict[str, Any]:
    """
    Generate complete ad content (copy + image) using AI.
    
    This is the main endpoint that combines both ad copy and image generation
    using the professional playbook system.
    
    **Supported Playbooks:**
    - Flash Sale: Urgent, time-sensitive promotions
    - New Arrival: Product launches and new stock
    - Best Seller Spotlight: Social proof and bestsellers
    - Bundle Up!: Value bundles and multi-product deals
    
    **Returns:**
    ```json
    {
        "success": true,
        "data": {
            "ad_copy": "Ready-to-post social media text",
            "hashtags": ["Hashtag1", "Hashtag2", ...],
            "image_url": "data:image/png;base64,..." or "https://..."
        }
    }
    ```
    """
    try:
        logger.info(
            "complete_ad_request",
            product=request.product_name,
            playbook=request.playbook,
            has_discount=bool(request.discount)
        )
        
        # Generate complete ad content using the service
        result = ad_service.generate_ad_content(
            product_name=request.product_name,
            playbook=request.playbook,
            discount=request.discount
        )
        
        logger.info("complete_ad_generated", has_image=bool(result.get("image_url")))
        
        return {
            "success": True,
            "data": result
        }
    
    except ValueError as e:
        logger.warning("invalid_request", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("ad_generation_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate ad content. Please try again."
        )


@router.post("/generate-copy", response_model=AdCopyResponse)
async def generate_ad_copy_only(request: AdCopyRequest) -> AdCopyResponse:
    """
    Generate AI-powered ad copy only (no image).
    
    Faster endpoint when you only need the text content.
    Uses Gemini 2.0 Flash for creative, playbook-driven copy.
    """
    try:
        logger.info(
            "ad_copy_request",
            product=request.product_name,
            playbook=request.playbook
        )
        
        # Generate only ad copy (with image analysis if provided)
        result = ad_service.generate_ad_content(
            product_name=request.product_name,
            playbook=request.playbook,
            discount=request.discount,
            product_image_url=request.product_image_url
        )
        
        response = AdCopyResponse(
            ad_copy=result["ad_copy"],
            hashtags=result["hashtags"]
        )
        
        logger.info("ad_copy_generated")
        return response
    
    except Exception as e:
        logger.error("ad_copy_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate ad copy"
        )


@router.post("/generate-image", response_model=AdImageResponse)
async def generate_ad_image_only(request: AdImageRequest) -> AdImageResponse:
    """
    Generate AI-powered ad images only (no copy).
    
    Uses Google Gemini's Imagen model for professional marketing images.
    Automatically falls back to high-quality placeholders if AI is unavailable.
    """
    try:
        # Require product image (from inventory/SmartShelf or user upload)
        if not request.product_image_url:
            logger.warning(
                "product_image_required",
                product=request.product_name,
                playbook=request.playbook
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product image is required. Please provide a product image from inventory, SmartShelf, or upload your own image."
            )
        
        logger.info(
            "ad_image_request",
            product=request.product_name,
            playbook=request.playbook,
            style=request.style,
            has_product_image=bool(request.product_image_url),
            product_image_url=request.product_image_url[:100] + "..." if request.product_image_url and len(request.product_image_url) > 100 else request.product_image_url
        )
        
        # Generate only the image
        result = ad_service.generate_ad_content(
            product_name=request.product_name,
            playbook=request.playbook,
            style=request.style,
            product_image_url=request.product_image_url,
            custom_prompt=request.custom_prompt,
            template_context=request.template_context
        )
        
        response = AdImageResponse(
            image_url=result["image_url"],
            warning=result.get("warning")
        )
        
        if result.get("warning"):
            logger.warning("ad_image_placeholder_used", warning=result["warning"])
        else:
            logger.info("ad_image_generated")
        
        return response
    
    except HTTPException:
        # Re-raise HTTP exceptions (like validation errors)
        raise
    except ValueError as ve:
        # Validation errors from Pydantic
        logger.warning(
            "ad_image_validation_error",
            error=str(ve),
            product=request.product_name if hasattr(request, 'product_name') else None
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(
            "ad_image_error",
            error=str(e),
            error_type=type(e).__name__,
            product=request.product_name if hasattr(request, 'product_name') else None
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate ad image: {str(e)}"
        )


@router.post("/generate-and-post", response_model=SocialMediaPostResponse)
async def generate_and_post_to_social_media(request: SocialMediaPostRequest) -> SocialMediaPostResponse:
    """
    Generate ad content and post directly to Facebook/Instagram.
    
    This endpoint combines ad generation with social media posting in one step.
    
    **Workflow:**
    1. Generate AI-powered ad copy and image
    2. Post to selected platforms (Facebook, Instagram, or both)
    3. Return post URLs and status
    
    **Requirements:**
    - Facebook Page ID (for Facebook posts)
    - Instagram Business Account ID (for Instagram posts)
    - Valid access tokens configured in environment
    
    **Note:**
    - Instagram requires publicly accessible image URLs
    - Base64 images will be uploaded to Facebook first
    """
    try:
        logger.info(
            "social_post_request",
            product=request.product_name,
            playbook=request.playbook,
            facebook=request.post_to_facebook,
            instagram=request.post_to_instagram
        )
        
        # Step 1: Generate ad content
        ad_content = ad_service.generate_ad_content(
            product_name=request.product_name,
            playbook=request.playbook,
            discount=request.discount
        )
        
        # Step 2: Prepare for social media posting
        message = ad_content["ad_copy"]
        image_url = ad_content["image_url"]
        hashtags = ad_content["hashtags"]
        
        results = {}
        posted_count = 0
        
        # Step 3: Post to Facebook if requested
        if request.post_to_facebook:
            if not request.facebook_page_id:
                results["facebook"] = {
                    "success": False,
                    "error": "Facebook Page ID is required"
                }
            else:
                facebook_result = await social_media_service.post_to_facebook(
                    page_id=request.facebook_page_id,
                    message=message,
                    image_url=image_url,
                    hashtags=hashtags,
                    scheduled_time=request.schedule_time
                )
                results["facebook"] = facebook_result
                if facebook_result.get("success"):
                    posted_count += 1
        
        # Step 4: Post to Instagram if requested
        if request.post_to_instagram:
            if not request.instagram_account_id:
                results["instagram"] = {
                    "success": False,
                    "error": "Instagram Account ID is required"
                }
            else:
                instagram_result = await social_media_service.post_to_instagram(
                    instagram_account_id=request.instagram_account_id,
                    caption=message,
                    image_url=image_url,
                    hashtags=hashtags
                )
                results["instagram"] = instagram_result
                if instagram_result.get("success"):
                    posted_count += 1
        
        total_platforms = sum([request.post_to_facebook, request.post_to_instagram])
        
        logger.info(
            "social_post_complete",
            posted=posted_count,
            total=total_platforms
        )
        
        return SocialMediaPostResponse(
            success=posted_count > 0,
            posted_to=posted_count,
            total_platforms=total_platforms,
            results=results
        )
    
    except Exception as e:
        logger.error("social_post_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate and post ad: {str(e)}"
        )
