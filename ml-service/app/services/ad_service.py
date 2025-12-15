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
    
    def generate_ad_content(
        self,
        product_name: str,
        playbook: str,
        discount: Optional[str] = None,
        style: Optional[str] = None
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
            
            # Generate ad copy
            ad_copy, hashtags = self._generate_ad_copy(
                product_name=product_name,
                playbook_config=config,
                discount=discount
            )
            
            # Generate ad image
            image_url = self._generate_ad_image(
                product_name=product_name,
                playbook_config=config,
                discount=discount,
                style=style
            )
            
            return {
                "ad_copy": ad_copy,
                "hashtags": hashtags,
                "image_url": image_url
            }
            
        except Exception as e:
            logger.error("ad_generation_failed", error=str(e), product=product_name)
            raise
    
    def _generate_ad_copy(
        self,
        product_name: str,
        playbook_config: PlaybookConfig,
        discount: Optional[str] = None
    ) -> Tuple[str, List[str]]:
        """Generate AI-powered ad copy using Gemini."""
        try:
            # Build discount information
            discount_info = ""
            if discount:
                discount_info = f"IMPORTANT: Prominently feature this discount: {discount}. Make it the hero of the message. "
            
            # Build the prompt
            prompt = playbook_config.copy_template.format(
                product=product_name,
                discount_info=discount_info
            )
            
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
            
            # Use Gemini 2.0 Flash for fast, creative copy
            try:
                response = self.client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=[prompt],
                    config=types.GenerateContentConfig(
                        temperature=0.9,  # High creativity
                        top_p=0.95,
                        top_k=40,
                        max_output_tokens=300,
                    )
                )
                
                ad_copy = response.text.strip()
                
                logger.info("ad_copy_generated", length=len(ad_copy))
                
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
        style: Optional[str] = None
    ) -> str:
        """
        Generate AI-powered ad image using Gemini 2.5 Flash Image model.
        
        Uses gemini-2.5-flash-image with responseModalities to generate images.
        Returns base64-encoded image data URL.
        """
        try:
            # Build discount visual information
            discount_visual = ""
            if discount:
                discount_visual = f"Discount badge prominently displayed: '{discount}' in large, bold text. "
            
            # Build the image generation prompt
            prompt = playbook_config.image_prompt_template.format(
                product=product_name,
                discount_visual=discount_visual
            )
            
            # Add custom style if provided
            if style:
                prompt += f"\nAdditional style preference: {style}. "
            
            if not self.gemini_configured or not self.client:
                logger.warning("gemini_not_available", mode="placeholder_fallback")
                return self._generate_placeholder_image(product_name, playbook_config)
            
            # Use gemini-2.5-flash-image with responseModalities for image generation
            try:
                # Enhanced prompt for high-quality marketing images
                enhanced_prompt = f"{prompt}\n\nIMPORTANT: Generate a high-resolution, professional marketing image suitable for social media advertising. The image must be crisp, clear, and visually appealing with excellent color contrast and professional composition."
                
                response = self.client.models.generate_content(
                    model=settings.IMAGEN_MODEL,  # gemini-2.5-flash-image
                    contents=[enhanced_prompt],
                    config=types.GenerateContentConfig(
                        response_modalities=["TEXT", "IMAGE"],
                        temperature=0.8,  # Slightly higher for more creative images
                    )
                )
                
                # Extract image from response
                # Based on google-genai SDK structure: response.candidates[0].content.parts
                image_data = None
                mime_type = "image/png"
                
                # Debug: Log response structure
                logger.debug(
                    "gemini_response_structure",
                    has_candidates=hasattr(response, 'candidates'),
                    response_type=type(response).__name__
                )
                
                # Try accessing via candidates (standard structure)
                if hasattr(response, 'candidates') and response.candidates:
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
                                elif hasattr(part, 'inlineData') and hasattr(part, 'inlineData'):
                                    inline_data = getattr(part, 'inlineData', None)
                                
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
                                            "image_data_extracted",
                                            data_type=type(raw_data).__name__,
                                            mime_type=mime_type,
                                            data_length=len(image_data) if image_data else 0
                                        )
                                        break
                
                # If still no image, try alternative access patterns
                if not image_data:
                    # Try accessing response directly
                    try:
                        # Check if response has a direct image property
                        if hasattr(response, 'images') and response.images:
                            image_data = response.images[0]
                            if isinstance(image_data, bytes):
                                image_data = base64.b64encode(image_data).decode('utf-8')
                    except Exception as e:
                        logger.debug("alternative_image_access_failed", error=str(e))
                
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
                        return self._generate_placeholder_image(product_name, playbook_config)
                    
                    # Convert to base64 data URL
                    image_url = f"data:{mime_type};base64,{image_data}"
                    
                    logger.info(
                        "ad_image_generated",
                        model=settings.IMAGEN_MODEL,
                        size_bytes=len(image_data),
                        mime_type=mime_type,
                        data_url_preview=image_url[:100]
                    )
                    
                    return image_url
                
                # If no image found in response, log warning and fallback
                logger.warning(
                    "no_image_in_response",
                    model=settings.IMAGEN_MODEL,
                    response_type=type(response).__name__,
                    has_candidates=hasattr(response, 'candidates'),
                    fallback="placeholder",
                    message=f"⚠️ IMAGE GENERATION FAILED: Model '{settings.IMAGEN_MODEL}' did not return image data. Using placeholder instead."
                )
                return self._generate_placeholder_image(product_name, playbook_config)
                
            except Exception as api_error:
                # Check for quota/rate limit errors
                error_str = str(api_error)
                if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str or "quota" in error_str.lower():
                    logger.warning(
                        "gemini_quota_exceeded_image",
                        error=error_str[:500],
                        fallback="placeholder",
                        message="Gemini API quota exceeded for image generation, using placeholder"
                    )
                    return self._generate_placeholder_image(product_name, playbook_config)
                else:
                    # Log other errors but still fallback
                    logger.error(
                        "image_generation_api_error",
                        error=error_str[:500],
                        error_type=type(api_error).__name__,
                        fallback="placeholder"
                    )
                    return self._generate_placeholder_image(product_name, playbook_config)
                
        except Exception as e:
            logger.error(
                "image_generation_failed",
                error=str(e),
                error_type=type(e).__name__,
                product=product_name
            )
            return self._generate_placeholder_image(product_name, playbook_config)
    
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


# Singleton instance
ad_service = AdService()
