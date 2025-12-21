# File: app/services/ad_service.py
"""
Purpose: MarketMate Ad Generation Service
Professional playbook-driven ad generation using Google Gemini 2.0 Flash.

Features:
- Structured playbook system for marketing campaigns
- AI-powered ad copy generation (Gemini 2.0 Flash)
- AI-powered image generation (Gemini Image Generation)
- Graceful fallback mechanisms
- Production-ready error handling
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
from enum import Enum
import structlog
from google import genai
from google.genai import types
from PIL import Image
import io
import base64
import time
import requests
import json
import re
from app.config import settings

logger = structlog.get_logger()


class PlaybookType(str, Enum):
    """Marketing playbook types."""
    FLASH_SALE = "Flash Sale"
    NEW_ARRIVAL = "New Arrival"
    BESTSELLER = "Best Seller Spotlight"
    BUNDLE = "Bundle Up!"


@dataclass
class PlaybookConfig:
    """Configuration for a marketing playbook."""
    name: str
    tone: str
    emojis: List[str]
    hashtags: List[str]
    color_scheme: str
    visual_elements: List[str]
    copy_template: str
    image_prompt_template: str


# ============================================
# Playbook Definitions
# ============================================

PLAYBOOKS: Dict[str, PlaybookConfig] = {
    PlaybookType.FLASH_SALE: PlaybookConfig(
        name="Flash Sale",
        tone="Urgent, high-energy, action-oriented",
        emojis=["⚡", "🔥", "💥", "⏰", "🚨"],
        hashtags=["FlashSale", "LimitedTimeOffer", "DealAlert", "ShopNow", "HurryUp"],
        color_scheme="bright reds, oranges, yellows - high contrast",
        visual_elements=["lightning bolts", "fire effects", "countdown timer", "bold text overlays", "urgent badges"],
        copy_template=(
            "Create an urgent, time-sensitive social media ad for {product}. "
            "Use a high-energy tone that creates FOMO (fear of missing out). "
            "Emphasize scarcity and time limitation. "
            "{discount_info}"
            "Include power words like: LIMITED, NOW, HURRY, LAST CHANCE. "
            "Use emojis: ⚡🔥💥⏰. "
            "End with a strong call-to-action. "
            "Format: Ready-to-post with hashtags. No preambles."
        ),
        image_prompt_template=(
            "Create a vibrant, eye-catching promotional image for {product}. "
            "Style: URGENT and ENERGETIC with bright red, orange, and yellow colors. "
            "Visual elements: Lightning bolts, fire effects, explosive graphics. "
            "Text overlay: 'FLASH SALE' in bold, large font. "
            "{discount_visual}"
            "Background: Dynamic, high-energy gradient (red to orange). "
            "Product: Prominently displayed, well-lit, professional photography. "
            "Mood: Excitement, urgency, limited-time opportunity. "
            "Aspect ratio: 1200x630 (social media optimized). "
            "Quality: High-resolution, marketing-grade."
        )
    ),
    
    PlaybookType.NEW_ARRIVAL: PlaybookConfig(
        name="New Arrival",
        tone="Exciting, trendy, fresh, modern",
        emojis=["✨", "🆕", "🎉", "🌟", "💫"],
        hashtags=["NewArrival", "JustDropped", "FreshStock", "NewIn", "TrendAlert"],
        color_scheme="turquoise, blue, white - clean and modern",
        visual_elements=["'NEW' badge", "sparkles", "modern minimalist design", "clean backgrounds", "premium feel"],
        copy_template=(
            "Create an exciting announcement for the NEW ARRIVAL of {product}. "
            "Use a trendy, fashion-forward tone that makes people want to be first. "
            "Emphasize exclusivity and freshness. "
            "Highlight what makes this product special or innovative. "
            "Use emojis: ✨🆕🎉🌟. "
            "Include phrases like: JUST ARRIVED, BE THE FIRST, BRAND NEW. "
            "Format: Ready-to-post with hashtags. No preambles."
        ),
        image_prompt_template=(
            "Create a fresh, modern promotional image for the NEW {product}. "
            "Style: CLEAN, MINIMALIST, PREMIUM with turquoise and blue accents. "
            "Visual elements: 'NEW' badge in top corner, subtle sparkle effects, modern typography. "
            "Background: Clean white or soft gradient, professional and uncluttered. "
            "Product: Center stage, perfect lighting, high-fashion/tech product photography style. "
            "Mood: Excitement, innovation, exclusive first access. "
            "Aspect ratio: 1200x630 (social media optimized). "
            "Quality: Crisp, high-resolution, magazine-quality."
        )
    ),
    
    PlaybookType.BESTSELLER: PlaybookConfig(
        name="Best Seller Spotlight",
        tone="Trust-building, social proof, authoritative",
        emojis=["⭐", "💯", "🏆", "👑", "✅"],
        hashtags=["BestSeller", "CustomerFavorite", "TopRated", "MostLoved", "Bestselling"],
        color_scheme="gold, blue, white - premium and trustworthy",
        visual_elements=["5-star ratings", "trophy/award icons", "customer review snippets", "gold badges", "premium borders"],
        copy_template=(
            "Create a trust-building social media ad for our BESTSELLER: {product}. "
            "Use social proof and customer testimonials tone. "
            "Emphasize popularity, high ratings, and customer satisfaction. "
            "Include specific details like: '⭐⭐⭐⭐⭐ Rated', 'Customer Favorite', 'Thousands Love It'. "
            "Use emojis: ⭐💯🏆👑. "
            "Build credibility and show why this is the top choice. "
            "Format: Ready-to-post with hashtags. No preambles."
        ),
        image_prompt_template=(
            "Create a premium, prestigious promotional image for the BESTSELLING {product}. "
            "Style: LUXURIOUS and TRUSTWORTHY with gold, blue, and white colors. "
            "Visual elements: 5-star rating display, gold 'BESTSELLER' badge, trophy or crown icon. "
            "Background: Premium gradient (deep blue to gold), elegant and sophisticated. "
            "Product: Showcased as premium item, studio lighting, award-winning product photography. "
            "Additional: Small rating stars (⭐⭐⭐⭐⭐) and 'Customer Favorite' text. "
            "Mood: Trust, quality, proven excellence, pride of ownership. "
            "Aspect ratio: 1200x630 (social media optimized). "
            "Quality: Premium, high-resolution, luxury brand aesthetic."
        )
    ),
    
    PlaybookType.BUNDLE: PlaybookConfig(
        name="Bundle Up!",
        tone="Value-focused, smart shopping, helpful",
        emojis=["📦", "🎁", "💰", "✨", "🤝"],
        hashtags=["BundleDeal", "ValuePack", "SaveMore", "SmartShopping", "BetterTogether"],
        color_scheme="green, white - friendly and value-oriented",
        visual_elements=["multiple products together", "gift box", "savings calculator", "plus signs between items", "value badges"],
        copy_template=(
            "Create a value-focused social media ad for our BUNDLE DEAL featuring {product}. "
            "Use a helpful, smart-shopping tone that emphasizes savings and value. "
            "{discount_info}"
            "Use math to show savings (e.g., 'Save 20% when you buy together'). "
            "Include emojis: 📦🎁💰✨. "
            "Explain why bundling makes sense and what items work well together. "
            "Format: Ready-to-post with hashtags. No preambles."
        ),
        image_prompt_template=(
            "Create a value-focused promotional image for the BUNDLE featuring {product}. "
            "Style: FRIENDLY and INVITING with green and white colors. "
            "Visual elements: Multiple items displayed together, plus signs (+) between products, gift box or packaging. "
            "{discount_visual}"
            "Background: Fresh green gradient, clean and approachable. "
            "Product arrangement: 2-3 items grouped together, showing complementary products. "
            "Text overlay: 'BUNDLE & SAVE' or 'BETTER TOGETHER'. "
            "Additional: Savings badge showing percentage or amount saved. "
            "Mood: Smart shopping, value, satisfaction, practical choice. "
            "Aspect ratio: 1200x630 (social media optimized). "
            "Quality: Professional, clean, catalog-style photography."
        )
    ),
}


# ============================================
# Ad Service Class
# ============================================

class AdService:
    """Professional ad generation service using Google Gemini."""
    
    def __init__(self):
        """Initialize the ad service with Gemini configuration."""
        self.gemini_configured = False
        self.client = None
        # Cache to track quota errors and skip attempts temporarily
        # Format: {model: {"timestamp": float, "retry_after": float}}
        self._quota_error_cache: Dict[str, Dict[str, float]] = {}
        self._default_cooldown_seconds = 120  # 2 minutes default cooldown
        
        if settings.GEMINI_API_KEY:
            try:
                # Initialize client - use default API version (v1) for stable models
                # v1alpha is only needed for experimental features, but Imagen isn't available there
                self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
                self.gemini_configured = True
                logger.info("gemini_configured", model=settings.GEMINI_MODEL)
            except Exception as e:
                logger.error("gemini_config_failed", error=str(e))
                self.gemini_configured = False
        else:
            logger.warning("gemini_api_key_missing", mode="fallback")
    
    def _is_quota_exceeded(self, model: str, allow_bypass: bool = False) -> bool:
        """
        Check if we recently hit quota limit for this model.
        
        Args:
            model: Model name to check
            allow_bypass: If True, allows bypassing cooldown (for user-initiated edits)
        """
        if allow_bypass:
            # User explicitly wants to try (e.g., custom prompt for editing)
            # Still check but use shorter cooldown
            pass
        
        if model not in self._quota_error_cache:
            return False
        
        error_info = self._quota_error_cache[model]
        last_error_time = error_info.get("timestamp", 0)
        retry_after = error_info.get("retry_after", self._default_cooldown_seconds)
        
        # Use shorter cooldown if user is explicitly trying (allow_bypass)
        cooldown = retry_after if not allow_bypass else min(retry_after, 30)  # Max 30 seconds for user-initiated
        
        elapsed = time.time() - last_error_time
        
        # If cooldown period has passed, clear the cache
        if elapsed > cooldown:
            del self._quota_error_cache[model]
            return False
        
        return True
    
    def _record_quota_error(self, model: str, error_message: str = ""):
        """
        Record that we hit a quota error for this model.
        Parses retry time from error message if available.
        """
        retry_after = self._default_cooldown_seconds
        
        # Try to parse retry time from error message
        # Format: "Please retry in X.XXXXX" or "retry in X.XXXXX"
        import re
        retry_match = re.search(r'retry in ([\d.]+)', error_message.lower())
        if retry_match:
            try:
                parsed_retry = float(retry_match.group(1))
                # Add 10% buffer and convert to seconds if needed
                retry_after = max(parsed_retry * 1.1, 30)  # At least 30 seconds
                # Cap at 5 minutes max
                retry_after = min(retry_after, 300)
            except (ValueError, AttributeError):
                pass
        
        self._quota_error_cache[model] = {
            "timestamp": time.time(),
            "retry_after": retry_after
        }
        logger.info(
            "quota_error_recorded",
            model=model,
            retry_after_seconds=retry_after,
            parsed_from_error=retry_match is not None
        )
    
    def generate_ad_content(
        self,
        product_name: str,
        playbook: str,
        discount: Optional[str] = None,
        style: Optional[str] = None,
        product_image_url: Optional[str] = None,
        custom_prompt: Optional[str] = None,
        template_context: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Generate complete ad content (copy + image) using AI.
        
        Args:
            product_name: Name of the product to advertise
            playbook: Marketing playbook to use (Flash Sale, New Arrival, etc.)
            discount: Optional discount information (e.g., "50% OFF", "$10 OFF")
            style: Optional custom style preference for image
            
        Returns:
            Dictionary with ad_copy, hashtags, and image_url
            
        Raises:
            ValueError: If playbook is invalid
            Exception: If generation fails completely
        """
        try:
            # Validate playbook
            if playbook not in PLAYBOOKS:
                logger.warning("invalid_playbook", playbook=playbook, fallback="generic")
                playbook = PlaybookType.FLASH_SALE  # Default fallback
            
            config = PLAYBOOKS[playbook]
            
            logger.info(
                "generating_ad_content",
                product=product_name,
                playbook=playbook,
                has_discount=bool(discount)
            )
            
            # Generate ad copy (with image analysis if available)
            ad_copy, hashtags = self._generate_ad_copy(
                product_name=product_name,
                playbook_config=config,
                discount=discount,
                product_image_url=product_image_url
            )
            
            # Generate ad image only if product_image_url is provided
            image_url = None
            is_placeholder = False
            if product_image_url:
                try:
                    image_url, is_placeholder = self._generate_ad_image(
                product_name=product_name,
                playbook_config=config,
                discount=discount,
                        style=style,
                        product_image_url=product_image_url,
                        custom_prompt=custom_prompt,
                        template_context=template_context
                    )
                except ValueError as e:
                    # If image generation fails due to missing product image, skip it
                    logger.warning(
                        "image_generation_skipped",
                        reason=str(e),
                        product=product_name
                    )
                    image_url = None
                    is_placeholder = False
            
            result = {
                "ad_copy": ad_copy,
                "hashtags": hashtags,
                "image_url": image_url or ""  # Return empty string if no image
            }
            
            # Add warning if placeholder was used
            if is_placeholder:
                error_info = self._quota_error_cache.get(settings.IMAGEN_MODEL, {})
                retry_after = error_info.get("retry_after", self._default_cooldown_seconds)
                retry_minutes = int(retry_after / 60) if retry_after >= 60 else int(retry_after)
                retry_unit = "minutes" if retry_after >= 60 else "seconds"
                
                if self._is_quota_exceeded(settings.IMAGEN_MODEL, allow_bypass=True):
                    result["warning"] = f"AI image generation quota exceeded. Using placeholder image. Please try again in {retry_minutes} {retry_unit} or check your Gemini API quota limits."
                else:
                    result["warning"] = "AI image generation unavailable (quota exceeded or API error). Using placeholder image."
            
            return result
            
        except Exception as e:
            logger.error("ad_generation_failed", error=str(e), product=product_name)
            raise
    
    def _generate_ad_copy(
        self,
        product_name: str,
        playbook_config: PlaybookConfig,
        discount: Optional[str] = None,
        product_image_url: Optional[str] = None
    ) -> Tuple[str, List[str]]:
        """Generate AI-powered ad copy using Gemini, with optional image analysis."""
        try:
            # Build discount information
            discount_info = ""
            if discount:
                discount_info = f"IMPORTANT: Prominently feature this discount: {discount}. Make it the hero of the message. "
            
            # Build the base prompt
            prompt = playbook_config.copy_template.format(
                product=product_name,
                discount_info=discount_info
            )
            
            # Add image analysis instruction if product image is provided
            image_analysis_instruction = ""
            if product_image_url:
                image_analysis_instruction = (
                    f"\n\nCRITICAL: Analyze the product image provided at: {product_image_url}. "
                    f"Based on what you see in the image, generate ad copy that accurately describes the ACTUAL product shown. "
                    f"Do NOT rely solely on the product name '{product_name}' - use the image to understand what the product really is. "
                    f"For example, if the image shows a food item (like an apple fruit) but the name is just 'Apple', "
                    f"write about the food product, NOT a technology product. "
                    f"Describe the product's actual appearance, colors, type, and characteristics from the image. "
                    f"Make the ad copy match what is visually shown in the product image."
                )
            
            prompt += image_analysis_instruction
            prompt += (
                f"\n\nTone: {playbook_config.tone}"
                f"\nMust include emojis from this list: {', '.join(playbook_config.emojis)}"
                f"\nMust include hashtags: #{' #'.join(playbook_config.hashtags[:3])}"
                f"\n\nIMPORTANT: Output ONLY the ad copy. No explanations, no 'Here is your ad', just the ready-to-post content."
            )
            
            if not self.gemini_configured or not self.client:
                # Fallback: Generate simple template-based copy
                logger.warning("gemini_not_available", mode="template_fallback")
                return self._generate_fallback_copy(product_name, playbook_config, discount)
            
            # Prepare content for Gemini
            # If product image is provided, include it for vision analysis
            contents = []
            if product_image_url:
                try:
                    # Load image from URL (supports both HTTP and base64 data URLs)
                    if product_image_url.startswith('data:image/'):
                        # Base64 data URL - handle various formats
                        try:
                            # Split by comma - data URL format: data:image/<type>;base64,<data> or data:image/<type>,<data>
                            if ',' in product_image_url:
                                header, encoded = product_image_url.split(',', 1)
                            else:
                                raise ValueError("Invalid data URL format: missing comma separator")
                            
                            # Extract mime type from header (handle both ;base64, and , formats)
                            mime_type = 'image/jpeg'  # Default
                            if ':' in header:
                                mime_part = header.split(':')[1]
                                if ';' in mime_part:
                                    mime_type = mime_part.split(';')[0]
                                else:
                                    mime_type = mime_part
                            
                            # Decode base64, handling potential whitespace and newlines
                            encoded_clean = encoded.strip().replace('\n', '').replace('\r', '').replace(' ', '')
                            
                            # Validate base64 before decoding
                            try:
                                base64.b64decode(encoded_clean, validate=True)
                            except Exception as validate_error:
                                logger.error(
                                    "invalid_base64_format",
                                    error=str(validate_error),
                                    preview=encoded_clean[:50] if encoded_clean else None
                                )
                                raise ValueError(f"Invalid base64 data: {str(validate_error)}")
                            
                            image_bytes = base64.b64decode(encoded_clean)
                            
                            logger.info(
                                "decoded_base64_image",
                                mime_type=mime_type,
                                size_bytes=len(image_bytes),
                                url_preview=product_image_url[:100]
                            )
                        except Exception as decode_error:
                            logger.error(
                                "failed_to_decode_base64",
                                error=str(decode_error),
                                error_type=type(decode_error).__name__,
                                url_preview=product_image_url[:100] if product_image_url else None
                            )
                            raise ValueError(f"Failed to decode base64 image: {str(decode_error)}")
                    elif product_image_url.startswith('http://') or product_image_url.startswith('https://'):
                        # HTTP URL - download the image
                        try:
                            response = requests.get(product_image_url, timeout=10, stream=True)
                            response.raise_for_status()
                            image_bytes = response.content
                            mime_type = response.headers.get('content-type', 'image/jpeg')
                            logger.info(
                                "downloaded_image",
                                mime_type=mime_type,
                                size_bytes=len(image_bytes)
                            )
                        except Exception as download_error:
                            logger.error(
                                "failed_to_download_image",
                                error=str(download_error),
                                url=product_image_url
                            )
                            raise ValueError(f"Failed to download image from URL: {str(download_error)}")
                    else:
                        raise ValueError(f"Unsupported image URL format: {product_image_url[:50]}")
                    
                    # Create PIL Image and convert to format Gemini expects
                    try:
                        img = Image.open(io.BytesIO(image_bytes))
                        # Convert to RGB if necessary (handles RGBA, P, etc.)
                        if img.mode != 'RGB':
                            img = img.convert('RGB')
                        
                        # Resize if too large (Gemini has size limits)
                        max_size = 4096  # Maximum dimension for Gemini
                        if img.width > max_size or img.height > max_size:
                            # Use LANCZOS if available, otherwise fallback to ANTIALIAS (Pillow < 10.0)
                            try:
                                img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                            except AttributeError:
                                # Fallback for older Pillow versions
                                img.thumbnail((max_size, max_size), Image.LANCZOS)
                            logger.info("resized_image_for_gemini", new_size=f"{img.width}x{img.height}")
                        
                        # Convert to bytes for Gemini
                        img_buffer = io.BytesIO()
                        img.save(img_buffer, format='JPEG', quality=85)  # Slightly lower quality to reduce size
                        img_bytes = img_buffer.getvalue()
                        
                        # Check final size (Gemini typically accepts up to 20MB)
                        max_size_bytes = 20 * 1024 * 1024
                        if len(img_bytes) > max_size_bytes:
                            # Further compress if still too large
                            quality = 70
                            img_buffer = io.BytesIO()
                            img.save(img_buffer, format='JPEG', quality=quality)
                            img_bytes = img_buffer.getvalue()
                            logger.warning("further_compressed_image", final_size=len(img_bytes))
                            
                    except Exception as img_process_error:
                        logger.error(
                            "failed_to_process_image",
                            error=str(img_process_error),
                            error_type=type(img_process_error).__name__
                        )
                        raise ValueError(f"Failed to process image: {str(img_process_error)}")
                    
                    # Add image to contents for vision analysis
                    # Use types.Part for proper Gemini API format
                    try:
                        contents = [
                            types.Part.from_bytes(
                                data=img_bytes,
                                mime_type="image/jpeg"
                            ),
                            prompt
                        ]
                        
                        logger.info(
                            "ad_copy_with_image_analysis",
                            product=product_name,
                            has_image=True,
                            image_size=len(img_bytes),
                            image_dimensions=f"{img.width}x{img.height}"
                        )
                    except Exception as part_error:
                        logger.error(
                            "failed_to_create_gemini_part",
                            error=str(part_error),
                            error_type=type(part_error).__name__,
                            image_size=len(img_bytes)
                        )
                        # Fallback to text-only if Gemini part creation fails
                        contents = [prompt]
                        logger.warning("falling_back_to_text_only_after_part_creation_failure")
                        
                except Exception as img_error:
                    logger.error(
                        "failed_to_load_product_image",
                        error=str(img_error),
                        error_type=type(img_error).__name__,
                        product=product_name,
                        url_preview=product_image_url[:100] if product_image_url else None,
                        fallback="text_only"
                    )
                    # Fallback to text-only if image loading fails
                    contents = [prompt]
                    logger.warning("falling_back_to_text_only_after_image_load_failure")
            else:
                # No image - text-only generation
                contents = [prompt]
            
            # Use Gemini 2.0 Flash for fast, creative copy (with vision if image provided)
            try:
                response = self.client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        temperature=0.9,  # High creativity
                        top_p=0.95,
                        top_k=40,
                        max_output_tokens=300,
                    )
                )
                
                ad_copy = response.text.strip()
                
                logger.info("ad_copy_generated", length=len(ad_copy), used_image=bool(product_image_url))
                
                return ad_copy, playbook_config.hashtags
                
            except Exception as api_error:
                # Check for quota/rate limit errors (429 RESOURCE_EXHAUSTED)
                error_str = str(api_error)
                if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str or "quota" in error_str.lower():
                    logger.warning(
                        "gemini_quota_exceeded",
                        error=error_str[:500],  # Truncate long error messages
                        fallback="template",
                        message="Gemini API quota exceeded, using template fallback"
                    )
                    return self._generate_fallback_copy(product_name, playbook_config, discount)
                else:
                    # Re-raise other errors to be caught by outer exception handler
                    raise
            
        except Exception as e:
            logger.error("ad_copy_generation_failed", error=str(e), error_type=type(e).__name__)
            # Fallback to template
            return self._generate_fallback_copy(product_name, playbook_config, discount)
    
    def _generate_ad_image(
        self,
        product_name: str,
        playbook_config: PlaybookConfig,
        discount: Optional[str] = None,
        style: Optional[str] = None,
        product_image_url: Optional[str] = None,
        custom_prompt: Optional[str] = None,
        template_context: Optional[str] = None
    ) -> Tuple[str, bool]:
        """
        Generate ad image.
        
        Returns:
            Tuple of (image_url, is_placeholder) where is_placeholder indicates if a placeholder was used.
        """
        """
        Generate AI-powered ad image using Gemini 2.5 Flash Image model.
        
        REQUIRES product_image_url from product inventory/SmartShelf.
        Uses gemini-2.5-flash-image with responseModalities to generate images.
        Returns base64-encoded image data URL.
        """
        # REQUIRE product image (from inventory/SmartShelf or user upload)
        if not product_image_url:
            logger.error(
                "product_image_required",
                product=product_name,
                playbook=playbook_config.name,
                message="Product image URL is required"
            )
            raise ValueError(
                "Product image is required. Please provide a product image from inventory, SmartShelf, or upload your own image."
            )
        
        try:
            # Build discount visual information
            discount_visual = ""
            if discount:
                discount_visual = f"Discount badge prominently displayed: '{discount}' in large, bold text. "
            
            # Load the product image to pass as visual input (not in prompt text)
            # This prevents token limit issues from base64 data URLs
            product_image_bytes = None
            product_image_mime = "image/jpeg"
            
            try:
                # Load image from URL (supports both HTTP and base64 data URLs)
                if product_image_url.startswith('data:image/'):
                    # Base64 data URL
                    try:
                        if ',' in product_image_url:
                            header, encoded = product_image_url.split(',', 1)
                        else:
                            raise ValueError("Invalid data URL format: missing comma separator")
                        
                        # Extract mime type from header
                        if ':' in header:
                            mime_part = header.split(':')[1]
                            if ';' in mime_part:
                                product_image_mime = mime_part.split(';')[0]
                            else:
                                product_image_mime = mime_part
                        
                        # Decode base64
                        encoded_clean = encoded.strip().replace('\n', '').replace('\r', '').replace(' ', '')
                        product_image_bytes = base64.b64decode(encoded_clean)
                        
                        logger.info(
                            "loaded_product_image_for_generation",
                            mime_type=product_image_mime,
                            size_bytes=len(product_image_bytes)
                        )
                    except Exception as decode_error:
                        logger.error("failed_to_load_product_image_for_generation", error=str(decode_error))
                        raise ValueError(f"Failed to load product image: {str(decode_error)}")
                        
                elif product_image_url.startswith('http://') or product_image_url.startswith('https://'):
                    # HTTP URL - download the image
                    try:
                        response = requests.get(product_image_url, timeout=10, stream=True)
                        response.raise_for_status()
                        product_image_bytes = response.content
                        product_image_mime = response.headers.get('content-type', 'image/jpeg')
                        logger.info("downloaded_product_image_for_generation", size_bytes=len(product_image_bytes))
                    except Exception as download_error:
                        logger.error("failed_to_download_product_image", error=str(download_error))
                        raise ValueError(f"Failed to download product image: {str(download_error)}")
                else:
                    raise ValueError(f"Unsupported image URL format: {product_image_url[:50]}")
                
                # Process image if needed (resize, convert format)
                if product_image_bytes:
                    img = Image.open(io.BytesIO(product_image_bytes))
                    if img.mode != 'RGB':
                        img = img.convert('RGB')
                    
                    # Resize if too large (Gemini has size limits)
                    max_size = 2048  # Smaller limit for image generation
                    if img.width > max_size or img.height > max_size:
                        try:
                            img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                        except AttributeError:
                            img.thumbnail((max_size, max_size), Image.LANCZOS)
                    
                    # Convert to bytes
                    img_buffer = io.BytesIO()
                    img.save(img_buffer, format='JPEG', quality=85)
                    product_image_bytes = img_buffer.getvalue()
                    product_image_mime = "image/jpeg"
                    
            except Exception as img_load_error:
                logger.error("failed_to_process_product_image", error=str(img_load_error))
                raise ValueError(f"Failed to process product image: {str(img_load_error)}")
            
            # Build a SHORT prompt without the image URL (image will be passed as visual input)
            prompt = (
                f"Generate a professional marketing ad image for {product_name}. "
                f"{playbook_config.image_prompt_template.format(product=product_name, discount_visual=discount_visual)}"
                f"\n\n"
                f"CRITICAL: Use the provided product image as your ONLY visual reference. "
                f"The generated ad MUST feature the EXACT product from the reference image with 100% accuracy. "
                f"Show the product prominently as the main focal point. "
                f"Integrate marketing elements (badges, text, backgrounds) around the product WITHOUT altering the product itself."
            )
            
            # Add custom style if provided (but don't let it override product accuracy)
            if style:
                prompt += f"\n\nStyle preference (apply to background/design elements only, NOT the product): {style}. "
            
            # Add template context if provided
            if template_context:
                prompt += f"\n\nTemplate Context: {template_context}. Apply these customizations to the ad design while maintaining product accuracy. "
            
            # Add custom prompt if provided (for image editing/regeneration)
            # Remove redundant information that's already in the base prompt
            if custom_prompt:
                # Clean the custom prompt to remove redundant product name, playbook info
                cleaned_prompt = self._clean_custom_prompt(custom_prompt, product_name, playbook_config.name)
                prompt += f"\n\nCUSTOM EDITING INSTRUCTIONS: {cleaned_prompt}. Apply these modifications to the generated ad image while keeping the product appearance accurate. "
            
            if not self.gemini_configured or not self.client:
                logger.warning("gemini_not_available", mode="placeholder_fallback")
                return (self._generate_placeholder_image(product_name, playbook_config), True)
            
            # Check if we recently hit quota limit - skip attempt if so
            # Allow bypass if custom_prompt is provided (user-initiated edit)
            allow_bypass = bool(custom_prompt)
            if self._is_quota_exceeded(settings.IMAGEN_MODEL, allow_bypass=allow_bypass):
                if allow_bypass:
                    logger.info(
                        "quota_cooldown_bypassed",
                        model=settings.IMAGEN_MODEL,
                        reason="User-initiated edit with custom prompt"
                    )
                    # Continue with attempt despite cooldown
                else:
                    logger.warning(
                        "skipping_image_generation_quota_cooldown",
                        model=settings.IMAGEN_MODEL,
                        message="Skipping image generation attempt due to recent quota error. Using placeholder."
                    )
                    return (self._generate_placeholder_image(product_name, playbook_config), True)
            
            # Use gemini-2.5-flash-image with responseModalities for image generation
            try:
                # Enhanced prompt for high-quality marketing images (SHORT - no base64 URL in text)
                enhanced_prompt = f"{prompt}\n\nIMPORTANT: Generate a high-resolution, professional marketing image suitable for social media advertising. The image must be crisp, clear, and visually appealing with excellent color contrast and professional composition."
                
                # Pass the product image as visual input along with the text prompt
                # This prevents token limit issues (base64 URLs are very long)
                contents = []
                if product_image_bytes:
                    # Add product image as visual input (not in text prompt)
                    contents.append(
                        types.Part.from_bytes(
                            data=product_image_bytes,
                            mime_type=product_image_mime
                        )
                    )
                    logger.info(
                        "added_product_image_as_visual_input",
                        image_size=len(product_image_bytes),
                        mime_type=product_image_mime
                    )
                # Add text prompt (without base64 URL)
                contents.append(enhanced_prompt)
                
                logger.info(
                    "generating_image_with_product_reference",
                    product=product_name,
                    has_product_image=bool(product_image_bytes),
                    prompt_length=len(enhanced_prompt)
                )
                
                response = self.client.models.generate_content(
                    model=settings.IMAGEN_MODEL,  # gemini-2.5-flash-image
                    contents=contents,  # Pass both image (visual) and text prompt
                    config=types.GenerateContentConfig(
                        response_modalities=["IMAGE"],  # Use only IMAGE modality for image generation
                        temperature=0.8,  # Slightly higher for more creative images
                    )
                )
                
                # Extract image from response
                # According to Gemini API docs, images are accessed via response.images[0]
                image_data = None
                mime_type = "image/png"
                
                # Debug: Log response structure
                logger.debug(
                    "gemini_response_structure",
                    has_images=hasattr(response, 'images'),
                    has_candidates=hasattr(response, 'candidates'),
                    response_type=type(response).__name__
                )
                
                # Primary method: Access via response.images (standard for image generation)
                if hasattr(response, 'images') and response.images:
                    try:
                        image_obj = response.images[0]
                        # The image object might be bytes, base64 string, or have a data attribute
                        if isinstance(image_obj, bytes):
                            image_data = base64.b64encode(image_obj).decode('utf-8')
                        elif isinstance(image_obj, str):
                            # Already a base64 string
                            image_data = image_obj
                        elif hasattr(image_obj, 'data'):
                            raw_data = image_obj.data
                            if isinstance(raw_data, bytes):
                                image_data = base64.b64encode(raw_data).decode('utf-8')
                            elif isinstance(raw_data, str):
                                image_data = raw_data
                        
                        # Get mime type if available
                        if hasattr(image_obj, 'mime_type') and image_obj.mime_type:
                            mime_type = image_obj.mime_type
                        elif hasattr(image_obj, 'mimeType') and image_obj.mimeType:
                            mime_type = image_obj.mimeType
                            
                        logger.info(
                            "image_extracted_from_response_images",
                            mime_type=mime_type,
                            data_length=len(image_data) if image_data else 0
                        )
                    except Exception as e:
                        logger.warning("failed_to_extract_from_images", error=str(e))
                
                # Fallback method: Try accessing via candidates (for compatibility)
                if not image_data and hasattr(response, 'candidates') and response.candidates:
                    candidate = response.candidates[0]
                    if hasattr(candidate, 'content'):
                        content = candidate.content
                        # Check if content has parts attribute
                        if hasattr(content, 'parts'):
                            for part in content.parts:
                                # Check for inline_data (image data) - try multiple attribute names
                                inline_data = None
                                
                                # Try different possible attribute names
                                if hasattr(part, 'inline_data'):
                                    inline_data = part.inline_data
                                elif hasattr(part, 'inlineData'):  # camelCase variant
                                    inline_data = part.inlineData
                                
                                if inline_data:
                                    # Get the base64 data - try multiple attribute names
                                    raw_data = None
                                    if hasattr(inline_data, 'data'):
                                        raw_data = inline_data.data
                                    elif hasattr(inline_data, 'Data'):
                                        raw_data = inline_data.Data
                                    
                                    if raw_data:
                                        # Handle different data types
                                        if isinstance(raw_data, str):
                                            # Already a string, assume it's base64
                                            image_data = raw_data
                                        elif isinstance(raw_data, bytes):
                                            # Convert bytes to base64 string
                                            image_data = base64.b64encode(raw_data).decode('utf-8')
                                        else:
                                            # Try to convert to string
                                            image_data = str(raw_data)
                                        
                                        # Get mime type
                                        if hasattr(inline_data, 'mime_type') and inline_data.mime_type:
                                            mime_type = inline_data.mime_type
                                        elif hasattr(inline_data, 'mimeType') and inline_data.mimeType:
                                            mime_type = inline_data.mimeType
                                        
                                        logger.info(
                                            "image_data_extracted_from_candidates",
                                            data_type=type(raw_data).__name__,
                                            mime_type=mime_type,
                                            data_length=len(image_data) if image_data else 0
                                        )
                                        break
                
                if image_data:
                    # Ensure image_data is properly formatted base64 string
                    # Remove any whitespace or newlines
                    image_data = image_data.strip()
                    
                    # Validate base64 format
                    try:
                        # Try to decode to verify it's valid base64
                        base64.b64decode(image_data, validate=True)
                    except Exception as e:
                        logger.error(
                            "invalid_base64_data",
                            error=str(e),
                            data_preview=image_data[:50] if image_data else None
                        )
                        return (self._generate_placeholder_image(product_name, playbook_config), True)
                    
                    # Convert to base64 data URL
                    image_url = f"data:{mime_type};base64,{image_data}"
                    
                    logger.info(
                        "ad_image_generated",
                        model=settings.IMAGEN_MODEL,
                        size_bytes=len(image_data),
                        mime_type=mime_type,
                        data_url_preview=image_url[:100]
                    )
                    
                    return (image_url, False)  # Real generated image
                
                # If no image found in response, log warning and fallback
                logger.warning(
                    "no_image_in_response",
                    model=settings.IMAGEN_MODEL,
                    response_type=type(response).__name__,
                    has_candidates=hasattr(response, 'candidates'),
                    fallback="placeholder"
                )
                return (self._generate_placeholder_image(product_name, playbook_config), True)
                
            except Exception as api_error:
                # Check for quota/rate limit errors
                error_str = str(api_error)
                if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str or "quota" in error_str.lower():
                    # Record the quota error to skip future attempts temporarily
                    self._record_quota_error(settings.IMAGEN_MODEL, error_str)
                    
                    # Get retry time for user-friendly message
                    error_info = self._quota_error_cache.get(settings.IMAGEN_MODEL, {})
                    retry_after = error_info.get("retry_after", self._default_cooldown_seconds)
                    retry_minutes = int(retry_after / 60) if retry_after >= 60 else int(retry_after)
                    retry_unit = "minutes" if retry_after >= 60 else "seconds"
                    
                    logger.warning(
                        "gemini_quota_exceeded_image",
                        error=error_str[:500],
                        fallback="placeholder",
                        retry_after_seconds=retry_after,
                        message=f"Gemini API quota exceeded for image generation, using placeholder. Please try again in {retry_minutes} {retry_unit}."
                    )
                    return (self._generate_placeholder_image(product_name, playbook_config), True)
                else:
                    # Log other errors but still fallback
                    logger.error(
                        "image_generation_api_error",
                        error=error_str[:500],
                        error_type=type(api_error).__name__,
                        fallback="placeholder"
                    )
                    return (self._generate_placeholder_image(product_name, playbook_config), True)
                
        except Exception as e:
            logger.error(
                "image_generation_failed",
                error=str(e),
                error_type=type(e).__name__,
                product=product_name
            )
            return (self._generate_placeholder_image(product_name, playbook_config), True)
    
    def _generate_fallback_copy(
        self,
        product_name: str,
        playbook_config: PlaybookConfig,
        discount: Optional[str] = None
    ) -> Tuple[str, List[str]]:
        """Generate template-based fallback ad copy."""
        emojis = " ".join(playbook_config.emojis[:3])
        
        if playbook_config.name == "Flash Sale":
            discount_text = f"Get {discount} " if discount else "HUGE SAVINGS "
            copy = (
                f"{emojis} LIMITED TIME OFFER! {emojis}\n\n"
                f"{discount_text}on {product_name}! "
                f"Don't miss out - this deal won't last! ⚡\n\n"
                f"Shop now before it's gone! 🔥\n\n"
                f"#{' #'.join(playbook_config.hashtags[:3])}"
            )
        elif playbook_config.name == "New Arrival":
            copy = (
                f"{emojis} JUST ARRIVED! {emojis}\n\n"
                f"Introducing the brand new {product_name}! "
                f"Be the first to get yours ✨\n\n"
                f"Fresh stock, exclusive access 🆕\n\n"
                f"#{' #'.join(playbook_config.hashtags[:3])}"
            )
        elif playbook_config.name == "Best Seller Spotlight":
            copy = (
                f"{emojis} CUSTOMER FAVORITE! {emojis}\n\n"
                f"⭐⭐⭐⭐⭐ Our bestselling {product_name} "
                f"Join thousands of happy customers! 💯\n\n"
                f"Proven quality, trusted choice 🏆\n\n"
                f"#{' #'.join(playbook_config.hashtags[:3])}"
            )
        else:  # Bundle
            discount_text = f"Save {discount} " if discount else "SAVE BIG "
            copy = (
                f"{emojis} BUNDLE & SAVE! {emojis}\n\n"
                f"{discount_text}when you bundle {product_name} with complementary items! "
                f"Better together 🎁\n\n"
                f"Smart shopping, more value 💰\n\n"
                f"#{' #'.join(playbook_config.hashtags[:3])}"
            )
        
        return copy, playbook_config.hashtags
    
    def _generate_placeholder_image(
        self,
        product_name: str,
        playbook_config: PlaybookConfig
    ) -> str:
        """Generate placeholder image URL as fallback."""
        color_map = {
            "Flash Sale": "FF6B6B/FFFFFF",
            "New Arrival": "4ECDC4/FFFFFF",
            "Best Seller Spotlight": "FFE66D/000000",
            "Bundle Up!": "A8E6CF/000000",
        }
        
        colors = color_map.get(playbook_config.name, "95E1D3/FFFFFF")
        product_encoded = product_name.replace(" ", "+")
        
        image_url = f"https://placehold.co/1200x630/{colors}?text={playbook_config.name}:+{product_encoded}"
        
        return image_url

    def get_prompt_suggestions(
        self,
        product_name: str,
        product_image_url: Optional[str] = None,
        playbook: Optional[str] = None,
        current_prompt: Optional[str] = None,
        result_type: Optional[str] = None
    ) -> Dict[str, List[str]]:
        """
        Get AI-powered prompt suggestions for ad generation.
        
        Args:
            product_name: Name of the product
            product_image_url: Optional product image URL for analysis
            playbook: Optional marketing playbook
            current_prompt: Optional current prompt to improve
            result_type: Optional desired result type (attention, conversion, engagement, brand, urgency)
        
        Returns:
            Dictionary with image_based_suggestions, result_based_suggestions, and general_tips
        """
        suggestions: Dict[str, List[str]] = {
            "image_based_suggestions": [],
            "result_based_suggestions": [],
            "general_tips": []
        }
        
        try:
            # Use Gemini for prompt suggestions
            if not self.gemini_configured:
                logger.warning("gemini_not_configured_for_suggestions")
                return self._get_fallback_suggestions(result_type)
            
            # Build prompt for Gemini
            prompt_parts = [
                f"Product: {product_name}",
            ]
            
            if playbook:
                prompt_parts.append(f"Playbook: {playbook}")
            
            if current_prompt:
                prompt_parts.append(f"Current prompt: {current_prompt}")
            
            if result_type:
                result_descriptions = {
                    "attention": "grab attention and stand out in crowded feeds",
                    "conversion": "drive immediate sales and purchases",
                    "engagement": "boost likes, shares, and comments",
                    "brand": "reinforce brand identity and values",
                    "urgency": "create urgency and prompt quick action"
                }
                prompt_parts.append(f"Goal: {result_descriptions.get(result_type, result_type)}")
            
            analysis_prompt = f"""
You are an expert marketing prompt engineer specializing in product advertising. Provide actionable suggestions to improve ad generation prompts.

{'Analyze the product image provided and suggest specific improvements based on visual elements, product features, and how to make the ad more compelling.' if product_image_url else ''}

Context:
{chr(10).join(prompt_parts)}

IMPORTANT REQUIREMENTS:
- All suggestions must be exactly 3 sentences long
- Each suggestion should be product-specific and actionable
- Focus on how to improve the ad based on the product's unique features and benefits
- Avoid generic advice - make it specific to this product
- When editing existing images, suggest only NEW modifications (don't repeat what's already in the current prompt)

Provide:
1. {'3-5 image-based suggestions' if product_image_url else '3-5 general visual suggestions'} - Each must be exactly 3 sentences focusing on product-specific visual improvements
2. {'3-5 result-based suggestions' if result_type else '3-5 general improvement suggestions'} - Each must be exactly 3 sentences tailored to the goal and product
3. 5 general tips - Each must be exactly 3 sentences for creating effective ad prompts for this product type

Format your response as JSON with keys: image_based_suggestions, result_based_suggestions, general_tips
Each should be an array of strings, where each string is exactly 3 sentences.
"""
            
            # If image URL provided, include it in the request
            if product_image_url:
                try:
                    # Download and process image
                    if product_image_url.startswith('data:image/'):
                        # Base64 data URL
                        header, encoded = product_image_url.split(',', 1)
                        image_bytes = base64.b64decode(encoded)
                    else:
                        # HTTP(S) URL
                        response = requests.get(product_image_url, timeout=10)
                        response.raise_for_status()
                        image_bytes = response.content
                    
                    # Process image
                    img = Image.open(io.BytesIO(image_bytes))
                    if img.mode != 'RGB':
                        img = img.convert('RGB')
                    
                    # Resize if too large
                    max_size = 2048
                    if img.width > max_size or img.height > max_size:
                        img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                    
                    # Convert to bytes
                    img_buffer = io.BytesIO()
                    img.save(img_buffer, format='JPEG', quality=85)
                    image_bytes = img_buffer.getvalue()
                    
                    # Use Gemini with vision
                    model = genai.GenerativeModel(
                        model_name=settings.GEMINI_MODEL,
                        generation_config=types.GenerationConfig(
                            temperature=0.7,
                            top_p=0.9,
                            top_k=40,
                            max_output_tokens=2048,
                        )
                    )
                    
                    # Create content with image
                    image_part = types.Part.from_bytes(
                        data=image_bytes,
                        mime_type="image/jpeg"
                    )
                    text_part = types.Part.from_text(text=analysis_prompt)
                    
                    response = model.generate_content([image_part, text_part])
                    result_text = response.text
                except Exception as img_error:
                    logger.warning("failed_to_process_image_for_suggestions", error=str(img_error))
                    # Fallback to text-only
                    model = genai.GenerativeModel(model_name=settings.GEMINI_MODEL)
                    response = model.generate_content(analysis_prompt)
                    result_text = response.text
            else:
                # Text-only analysis
                model = genai.GenerativeModel(model_name=settings.GEMINI_MODEL)
                response = model.generate_content(analysis_prompt)
                result_text = response.text
            
            # Parse JSON response
            # Try to extract JSON from response
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group())
                suggestions.update({
                    "image_based_suggestions": parsed.get("image_based_suggestions", []),
                    "result_based_suggestions": parsed.get("result_based_suggestions", []),
                    "general_tips": parsed.get("general_tips", [])
                })
            else:
                # Fallback: parse as text
                suggestions = self._parse_text_suggestions(result_text, result_type)
            
            logger.info("prompt_suggestions_generated", 
                       image_count=len(suggestions.get("image_based_suggestions", [])),
                       result_count=len(suggestions.get("result_based_suggestions", [])),
                       tips_count=len(suggestions.get("general_tips", [])))
            
        except Exception as e:
            logger.error("failed_to_generate_suggestions", error=str(e))
            suggestions = self._get_fallback_suggestions(result_type)
        
        return suggestions
    
    def _parse_text_suggestions(self, text: str, result_type: Optional[str]) -> Dict[str, List[str]]:
        """Parse text response into structured suggestions."""
        suggestions: Dict[str, List[str]] = {
            "image_based_suggestions": [],
            "result_based_suggestions": [],
            "general_tips": []
        }
        
        # Simple parsing - look for numbered lists or bullet points
        lines = text.split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Detect section headers
            if 'image' in line.lower() or 'visual' in line.lower():
                current_section = "image_based_suggestions"
            elif 'result' in line.lower() or 'goal' in line.lower() or 'outcome' in line.lower():
                current_section = "result_based_suggestions"
            elif 'tip' in line.lower() or 'general' in line.lower():
                current_section = "general_tips"
            
            # Extract suggestions (numbered or bulleted)
            if line.startswith(('1.', '2.', '3.', '4.', '5.', '-', '•', '*')):
                suggestion = re.sub(r'^[\d\.\-\•\*]\s*', '', line)
                if suggestion and current_section:
                    suggestions[current_section].append(suggestion)
                elif suggestion:
                    suggestions["general_tips"].append(suggestion)
        
        return suggestions
    
    def _clean_custom_prompt(self, custom_prompt: str, product_name: str, playbook_name: str) -> str:
        """
        Remove redundant information from custom prompt when editing generated images.
        
        Removes:
        - Product name (already in base prompt)
        - Playbook name (already in base prompt)
        - Generic instructions that are already handled
        - Duplicate information about product accuracy
        """
        cleaned = custom_prompt.strip()
        
        # Remove redundant product name mentions (case-insensitive)
        # Only remove if it's a standalone mention, not part of a feature description
        product_name_lower = product_name.lower()
        # Pattern: "product name" or "the product name" at start or after punctuation
        patterns_to_remove = [
            rf'\b{re.escape(product_name)}\b',
            rf'\bthe\s+{re.escape(product_name)}\b',
            rf'\b{re.escape(product_name)}\s+product\b',
        ]
        
        for pattern in patterns_to_remove:
            # Only remove if it's not part of a meaningful description
            # Check if it's followed by meaningful content (not just "should be" or similar)
            cleaned = re.sub(
                rf'(?i)(?:^|[\.,;:]\s*){pattern}(?:\s+should\s+be|\s+must\s+be|\s+needs?\s+to|\s+is\s+required)[\.,;:]?\s*',
                '',
                cleaned,
                flags=re.IGNORECASE
            )
        
        # Remove redundant playbook mentions
        cleaned = re.sub(
            rf'(?i)\b{re.escape(playbook_name)}\s+(?:playbook|style|theme|type)[\.,;:]?\s*',
            '',
            cleaned
        )
        
        # Remove redundant accuracy/product appearance instructions
        redundant_phrases = [
            r'keep\s+the\s+product\s+accurate',
            r'maintain\s+product\s+accuracy',
            r'product\s+appearance\s+must\s+be\s+accurate',
            r'do\s+not\s+alter\s+the\s+product',
            r'product\s+should\s+remain\s+the\s+same',
        ]
        
        for phrase in redundant_phrases:
            cleaned = re.sub(rf'(?i){phrase}[\.,;:]?\s*', '', cleaned)
        
        # Remove extra whitespace and normalize
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        
        # Remove leading/trailing punctuation that might be left
        cleaned = re.sub(r'^[\.,;:\s]+|[\.,;:\s]+$', '', cleaned)
        
        return cleaned if cleaned else custom_prompt  # Return original if cleaning removed everything
    
    def _get_fallback_suggestions(self, result_type: Optional[str]) -> Dict[str, List[str]]:
        """Return fallback suggestions when AI is unavailable. All suggestions are 3 sentences."""
        suggestions: Dict[str, List[str]] = {
            "image_based_suggestions": [
                "Analyze the product's key visual features and highlight them with strategic lighting that emphasizes texture and form. Use a clean, uncluttered background that complements the product's color scheme without competing for attention. Ensure the product occupies at least 60% of the frame and is positioned as the clear focal point with appropriate depth of field.",
                "Consider the product's unique selling points and create visual hierarchy that guides the eye to these features first. Apply color theory principles to choose background colors that make the product pop while maintaining brand consistency. Use professional product photography techniques like three-point lighting to showcase the product's quality and details.",
                "Identify the product's most compelling angle and composition that best represents its value proposition. Incorporate subtle design elements like shadows, reflections, or complementary props that enhance rather than distract from the product. Maintain visual balance and ensure all marketing elements (badges, text overlays) integrate seamlessly without obscuring product details."
            ],
            "result_based_suggestions": [],
            "general_tips": [
                "Focus on the product's unique features and translate them into visual benefits that resonate with your target audience. Use specific product attributes like materials, functionality, or design elements to create compelling visual narratives. Ensure every design choice reinforces the product's value proposition and differentiates it from competitors.",
                "Understand your target audience's preferences and create visual content that speaks directly to their needs and aspirations. Incorporate emotional triggers through color psychology, imagery, and composition that align with your audience's lifestyle and values. Test different visual approaches to find what resonates best with your specific customer segment.",
                "Use action-oriented visual language that encourages engagement and conversion through clear visual hierarchy and compelling imagery. Include visual call-to-action elements that guide the viewer's eye naturally toward the product and key messaging. Balance aesthetic appeal with functional clarity to ensure the ad communicates both beauty and utility effectively.",
                "Consider the context where your ad will be displayed and optimize visual elements accordingly for maximum impact. Adapt color schemes, text sizes, and composition to work well across different platforms and screen sizes. Ensure the ad stands out in crowded feeds while maintaining brand consistency and professional appearance.",
                "Leverage the product's story and brand narrative to create authentic visual connections with potential customers. Use visual metaphors, lifestyle imagery, or before/after scenarios that demonstrate the product's value in real-world contexts. Build trust through high-quality imagery that accurately represents the product and sets realistic expectations."
            ]
        }
        
        if result_type:
            result_suggestions = {
                "attention": [
                    "Use bold, high-contrast color combinations that make the product stand out immediately in crowded social media feeds. Incorporate dynamic visual elements like motion blur effects, sparkles, or animated-style graphics that catch the eye and create visual interest. Create strong visual hierarchy through strategic size differences, positioning, and focal points that guide attention directly to the product and key messaging.",
                    "Apply the rule of thirds and use negative space strategically to make the product the undeniable center of attention. Use vibrant, saturated colors that contrast with typical feed backgrounds to ensure your ad breaks through the visual noise. Add subtle animation cues or directional elements like arrows, light rays, or motion lines that naturally draw the eye toward the product.",
                    "Leverage psychological principles like the Von Restorff effect by making your product visually distinct from surrounding content through unique color schemes or unusual compositions. Use bright, attention-grabbing accents or highlights that create visual pop without overwhelming the product itself. Ensure the product is positioned in the most visually prominent area with supporting elements that enhance rather than compete for attention."
                ],
                "conversion": [
                    "Include clear, prominent call-to-action elements like buttons, arrows, or text overlays that guide viewers toward making a purchase decision. Showcase the product's key benefits and value propositions prominently through visual storytelling that demonstrates real-world use or outcomes. Add trust-building indicators like quality badges, customer testimonials, or security symbols that reduce purchase hesitation and increase conversion confidence.",
                    "Create a sense of value and urgency through visual elements like discount badges, price comparisons, or limited-time offers that encourage immediate action. Use before-and-after imagery or lifestyle scenarios that help potential customers visualize themselves using the product successfully. Incorporate social proof elements like 'bestseller' labels, review stars, or customer count indicators that validate the product's popularity and quality.",
                    "Design the ad with a clear visual flow that leads from attention-grabbing elements to product details to call-to-action in a natural progression. Use color psychology strategically with conversion-focused colors like orange or red for CTAs while maintaining overall brand consistency. Ensure all visual elements work together to create a compelling narrative that addresses customer pain points and positions the product as the ideal solution."
                ],
                "engagement": [
                    "Use relatable lifestyle scenarios or aspirational imagery that viewers can connect with emotionally and see themselves in the context of using your product. Include interactive visual elements like questions, polls, or 'swipe to see more' cues that encourage active participation rather than passive viewing. Create visually shareable content with aesthetically pleasing compositions, trending design styles, or meme-worthy elements that people want to share with their networks.",
                    "Incorporate storytelling elements through sequential imagery, visual narratives, or behind-the-scenes content that builds emotional connection and engagement. Use user-generated content styles or authentic-looking imagery that feels genuine and relatable rather than overly polished or corporate. Add visual hooks like intriguing compositions, unexpected elements, or visual questions that spark curiosity and encourage comments and shares.",
                    "Leverage current design trends, color palettes, or visual styles that resonate with your target audience's aesthetic preferences and cultural context. Create visually cohesive content that fits naturally into social media feeds while still standing out through unique product presentation. Include visual elements that invite interaction like 'tag a friend' cues, comparison visuals, or visual challenges that encourage engagement beyond just viewing."
                ],
                "brand": [
                    "Incorporate brand colors, typography, and visual style consistently throughout the ad to reinforce brand identity and recognition. Use brand-specific design elements like logo placement, signature patterns, or distinctive visual motifs that create immediate brand association. Maintain brand voice and aesthetic standards while adapting to the product's unique features and the playbook's marketing objectives.",
                    "Create visual consistency with your brand's existing content library through shared color palettes, design language, and compositional styles. Use brand-specific imagery, photography styles, or illustration techniques that align with your brand's personality and values. Ensure the ad feels authentically part of your brand family while still being optimized for the specific product and marketing goal.",
                    "Leverage brand assets like mascots, signature graphics, or brand-specific visual elements that strengthen brand recall and connection. Apply your brand's visual guidelines consistently including spacing, typography choices, and color usage that maintain brand integrity. Build brand equity through visual storytelling that reinforces your brand's unique value proposition and differentiates you from competitors."
                ],
                "urgency": [
                    "Add prominent countdown timers, limited-time badges, or time-sensitive visual indicators that create immediate urgency and prompt quick action. Use action-oriented visual language through dynamic compositions, motion cues, or energetic color schemes that convey speed and immediacy. Create visual scarcity indicators like 'limited stock' badges, 'only X left' counters, or 'selling fast' warnings that motivate immediate purchase decisions.",
                    "Incorporate visual urgency signals like flashing elements, bold expiration dates, or prominent deadline displays that make time sensitivity impossible to ignore. Use high-energy color combinations like red and orange that psychologically trigger urgency and action responses. Design the ad with a sense of momentum and forward motion through directional elements, dynamic layouts, or action-oriented imagery that suggests immediate action is needed.",
                    "Create visual FOMO (fear of missing out) through imagery that shows others benefiting from the product or limited availability indicators. Use contrasting visual elements that highlight the urgency message while maintaining product visibility and brand consistency. Ensure urgency elements are prominent but don't overwhelm the product itself, maintaining a balance between creating urgency and showcasing value."
                ]
            }
            suggestions["result_based_suggestions"] = result_suggestions.get(result_type, [])
        
        return suggestions


# Singleton instance
ad_service = AdService()
