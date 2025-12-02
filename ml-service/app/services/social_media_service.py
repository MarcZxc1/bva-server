# File: app/services/social_media_service.py
"""
Purpose: Social Media Integration Service
Handles posting generated ads to Facebook and Instagram via Meta Business API.

Features:
- Post to Facebook Pages
- Post to Instagram Business Accounts
- Upload images with captions
- Schedule posts
- Track post performance
"""

from typing import Dict, List, Optional, Any
import structlog
import httpx
from datetime import datetime
from app.config import settings

logger = structlog.get_logger()


class SocialMediaService:
    """Service for posting to Facebook and Instagram."""
    
    def __init__(self):
        """Initialize social media service with Meta API credentials."""
        self.facebook_access_token = settings.FACEBOOK_ACCESS_TOKEN
        self.instagram_access_token = settings.INSTAGRAM_ACCESS_TOKEN
        self.graph_api_url = "https://graph.facebook.com/v18.0"
        
    async def post_to_facebook(
        self,
        page_id: str,
        message: str,
        image_url: Optional[str] = None,
        hashtags: Optional[List[str]] = None,
        scheduled_time: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Post ad content to Facebook Page.
        
        Args:
            page_id: Facebook Page ID
            message: Ad copy text
            image_url: URL or base64 of the image
            hashtags: List of hashtags to include
            scheduled_time: Optional time to schedule the post
            
        Returns:
            Dict with post_id and status
        """
        try:
            # Prepare caption with hashtags
            caption = message
            if hashtags:
                hashtag_text = " ".join([f"#{tag}" for tag in hashtags])
                caption = f"{message}\n\n{hashtag_text}"
            
            # Prepare API request
            endpoint = f"{self.graph_api_url}/{page_id}"
            
            if image_url:
                # Post with image (photo)
                if image_url.startswith("data:image"):
                    # Base64 image - need to upload first
                    photo_id = await self._upload_photo_base64(page_id, image_url, caption)
                    endpoint = f"{endpoint}/photos"
                    params = {
                        "access_token": self.facebook_access_token,
                        "published": "true" if not scheduled_time else "false",
                        "message": caption
                    }
                else:
                    # URL image
                    endpoint = f"{endpoint}/photos"
                    params = {
                        "url": image_url,
                        "message": caption,
                        "access_token": self.facebook_access_token,
                        "published": "true" if not scheduled_time else "false"
                    }
                
                # Add scheduled time if provided
                if scheduled_time:
                    params["scheduled_publish_time"] = int(scheduled_time.timestamp())
                    params["published"] = "false"
            else:
                # Text-only post
                endpoint = f"{endpoint}/feed"
                params = {
                    "message": caption,
                    "access_token": self.facebook_access_token
                }
            
            # Make API request
            async with httpx.AsyncClient() as client:
                response = await client.post(endpoint, params=params)
                response.raise_for_status()
                
                result = response.json()
                
                logger.info(
                    "facebook_post_success",
                    page_id=page_id,
                    post_id=result.get("id"),
                    scheduled=bool(scheduled_time)
                )
                
                return {
                    "success": True,
                    "platform": "facebook",
                    "post_id": result.get("id"),
                    "post_url": f"https://facebook.com/{result.get('id')}",
                    "scheduled": bool(scheduled_time)
                }
                
        except httpx.HTTPStatusError as e:
            logger.error("facebook_post_failed", error=str(e), status=e.response.status_code)
            return {
                "success": False,
                "platform": "facebook",
                "error": f"API Error: {e.response.text}"
            }
        except Exception as e:
            logger.error("facebook_post_exception", error=str(e))
            return {
                "success": False,
                "platform": "facebook",
                "error": str(e)
            }
    
    async def post_to_instagram(
        self,
        instagram_account_id: str,
        caption: str,
        image_url: str,
        hashtags: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Post ad content to Instagram Business Account.
        
        Args:
            instagram_account_id: Instagram Business Account ID
            caption: Ad copy text
            image_url: URL of the image (Instagram requires URL, not base64)
            hashtags: List of hashtags to include
            
        Returns:
            Dict with post_id and status
            
        Note:
            Instagram requires a 2-step process:
            1. Create media container
            2. Publish the container
        """
        try:
            # Prepare caption with hashtags
            full_caption = caption
            if hashtags:
                hashtag_text = " ".join([f"#{tag}" for tag in hashtags])
                full_caption = f"{caption}\n\n{hashtag_text}"
            
            # Step 1: Create media container
            create_endpoint = f"{self.graph_api_url}/{instagram_account_id}/media"
            
            # Handle base64 images - convert to hosted URL first
            if image_url.startswith("data:image"):
                # For Instagram, you need to host the image somewhere accessible
                # Option 1: Upload to your own CDN/storage
                # Option 2: Use Facebook's image hosting
                logger.warning("instagram_base64_image", action="need_to_upload_to_cdn")
                return {
                    "success": False,
                    "platform": "instagram",
                    "error": "Instagram requires publicly accessible image URLs. Please upload the base64 image to a CDN first."
                }
            
            create_params = {
                "image_url": image_url,
                "caption": full_caption,
                "access_token": self.instagram_access_token
            }
            
            async with httpx.AsyncClient() as client:
                # Create container
                create_response = await client.post(create_endpoint, params=create_params)
                create_response.raise_for_status()
                container_result = create_response.json()
                container_id = container_result.get("id")
                
                logger.info("instagram_container_created", container_id=container_id)
                
                # Step 2: Publish the container
                publish_endpoint = f"{self.graph_api_url}/{instagram_account_id}/media_publish"
                publish_params = {
                    "creation_id": container_id,
                    "access_token": self.instagram_access_token
                }
                
                publish_response = await client.post(publish_endpoint, params=publish_params)
                publish_response.raise_for_status()
                publish_result = publish_response.json()
                
                logger.info(
                    "instagram_post_success",
                    account_id=instagram_account_id,
                    post_id=publish_result.get("id")
                )
                
                return {
                    "success": True,
                    "platform": "instagram",
                    "post_id": publish_result.get("id"),
                    "post_url": f"https://instagram.com/p/{publish_result.get('id')}"
                }
                
        except httpx.HTTPStatusError as e:
            logger.error("instagram_post_failed", error=str(e), status=e.response.status_code)
            return {
                "success": False,
                "platform": "instagram",
                "error": f"API Error: {e.response.text}"
            }
        except Exception as e:
            logger.error("instagram_post_exception", error=str(e))
            return {
                "success": False,
                "platform": "instagram",
                "error": str(e)
            }
    
    async def post_to_both(
        self,
        facebook_page_id: str,
        instagram_account_id: str,
        message: str,
        image_url: str,
        hashtags: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Post to both Facebook and Instagram simultaneously.
        
        Args:
            facebook_page_id: Facebook Page ID
            instagram_account_id: Instagram Business Account ID
            message: Ad copy text
            image_url: Image URL
            hashtags: List of hashtags
            
        Returns:
            Dict with results from both platforms
        """
        results = {
            "facebook": await self.post_to_facebook(
                page_id=facebook_page_id,
                message=message,
                image_url=image_url,
                hashtags=hashtags
            ),
            "instagram": await self.post_to_instagram(
                instagram_account_id=instagram_account_id,
                caption=message,
                image_url=image_url,
                hashtags=hashtags
            )
        }
        
        success_count = sum(1 for r in results.values() if r.get("success"))
        
        return {
            "success": success_count > 0,
            "posted_to": success_count,
            "total_platforms": 2,
            "results": results
        }
    
    async def _upload_photo_base64(
        self,
        page_id: str,
        base64_data: str,
        caption: str
    ) -> str:
        """
        Upload base64 image to Facebook for posting.
        
        Args:
            page_id: Facebook Page ID
            base64_data: Base64 encoded image (data:image/png;base64,...)
            caption: Image caption
            
        Returns:
            Photo ID
        """
        # Extract base64 content
        import base64
        import io
        
        # Remove data URL prefix
        image_data = base64_data.split(",")[1] if "," in base64_data else base64_data
        image_bytes = base64.b64decode(image_data)
        
        # Upload to Facebook
        endpoint = f"{self.graph_api_url}/{page_id}/photos"
        
        files = {
            "source": ("image.png", io.BytesIO(image_bytes), "image/png")
        }
        
        params = {
            "caption": caption,
            "published": "false",  # Don't publish yet, just upload
            "access_token": self.facebook_access_token
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(endpoint, params=params, files=files)
            response.raise_for_status()
            result = response.json()
            
            return result.get("id")


# Singleton instance
social_media_service = SocialMediaService()
