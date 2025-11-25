# File: app/services/promotion_service.py
"""
Purpose: Promotion planning by pairing near-expiry products with calendar events.
Generates discount recommendations and marketing copy.

Key functions:
- generate_promotions: Main entry point
- compute_discount_recommendation: Calculate optimal discount
- generate_promo_copy: Create marketing text
- estimate_clear_time: Predict days to sell-through at discount rate
"""

from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
import pandas as pd
import structlog
from app.schemas.forecast_schema import (
    NearExpiryItem,
    CalendarEvent,
    GeneratedPromotion,
    PromotionPreferences
)
from app.utils.explainability import generate_promotion_reasoning
from app.config import settings

logger = structlog.get_logger()


def generate_promotions(
    shop_id: str,
    items: List[NearExpiryItem],
    events: List[CalendarEvent],
    preferences: PromotionPreferences
) -> List[GeneratedPromotion]:
    """
    Generate promotion recommendations by pairing products with events.
    
    Args:
        shop_id: Shop identifier
        items: Near-expiry products
        events: Upcoming calendar events
        preferences: Business constraints
    
    Returns:
        List of GeneratedPromotion objects
    
    Algorithm:
    1. For each near-expiry item, find suitable events (within expiry window)
    2. Compute recommended discount based on urgency and margin constraints
    3. Generate marketing copy
    4. Estimate clearance time
    5. Rank by confidence and impact
    """
    promotions = []
    
    # Use timezone-aware UTC now
    now = datetime.now(timezone.utc)
    
    for item in items:
        expiry_date = pd.to_datetime(item.expiry_date)
        if expiry_date.tzinfo is None:
            expiry_date = expiry_date.tz_localize('UTC')
        else:
            expiry_date = expiry_date.tz_convert('UTC')
            
        days_to_expiry = (expiry_date - now).days
        
        if days_to_expiry <= 0:
            continue  # Already expired
        
        # Find suitable events (within expiry window)
        suitable_events = _find_suitable_events(item, events, expiry_date, now)
        
        for event in suitable_events:
            # Compute discount
            discount_pct = _compute_discount(
                days_to_expiry=days_to_expiry,
                quantity=item.quantity,
                price=item.price,
                preferences=preferences
            )
            
            # Estimate clear time
            clear_days = _estimate_clear_time(
                quantity=item.quantity,
                base_velocity=1.0,  # Assume 1 unit/day baseline
                discount_pct=discount_pct
            )
            
            # Generate copy
            promo_copy = _generate_promo_copy(item, event, discount_pct)
            
            # Determine promotion timing
            event_date = pd.to_datetime(event.date)
            if event_date.tzinfo is None:
                event_date = event_date.tz_localize('UTC')
            else:
                event_date = event_date.tz_convert('UTC')
                
            start_date = max(now, event_date - timedelta(days=2))
            end_date = min(expiry_date - timedelta(days=1), event_date + timedelta(days=3))
            
            # Compute confidence
            confidence = _compute_confidence(days_to_expiry, clear_days, discount_pct)
            
            # Generate reasoning
            reasoning = generate_promotion_reasoning(
                product_name=item.name,
                event_title=event.title,
                days_to_expiry=days_to_expiry,
                discount_pct=discount_pct,
                expected_clear_days=clear_days
            )
            
            # Compute sales lift
            sales_lift = settings.PROMOTION_ELASTICITY_MULTIPLIER * discount_pct
            
            promotion = GeneratedPromotion(
                event_id=event.id,
                event_title=event.title,
                product_id=item.product_id,
                product_name=item.name,
                suggested_discount_pct=discount_pct,
                promo_copy=promo_copy,
                start_date=start_date.isoformat(),
                end_date=end_date.isoformat(),
                expected_clear_days=clear_days,
                projected_sales_lift=sales_lift,
                confidence=confidence,
                reasoning=reasoning
            )
            
            promotions.append(promotion)
    
    # Sort by confidence then discount
    promotions.sort(
        key=lambda p: (p.confidence, -p.suggested_discount_pct),
        reverse=True
    )
    
    logger.info("promotions_generated", count=len(promotions))
    
    return promotions


def _find_suitable_events(
    item: NearExpiryItem,
    events: List[CalendarEvent],
    expiry_date: datetime,
    now: datetime
) -> List[CalendarEvent]:
    """Find events within product expiry window."""
    suitable = []
    
    for event in events:
        event_date = pd.to_datetime(event.date)
        if event_date.tzinfo is None:
            event_date = event_date.tz_localize('UTC')
        else:
            event_date = event_date.tz_convert('UTC')
        
        # Event should be before expiry
        if now <= event_date <= expiry_date:
            suitable.append(event)
    
    return suitable


def _compute_discount(
    days_to_expiry: int,
    quantity: int,
    price: float,
    preferences: PromotionPreferences
) -> float:
    """
    Compute recommended discount percentage.
    
    Formula:
    - Base discount = 10% + (urgency_factor * 30%)
    - Urgency_factor = 1 - (days_left / 7)
    - Capped by max_discount and min_margin
    """
    urgency_factor = max(0, 1 - days_to_expiry / 7)
    base_discount = 10.0 + (urgency_factor * 30.0)
    
    # Apply constraints
    discount = min(base_discount, preferences.discount_max_pct)
    
    # Check margin constraint
    margin_after_discount = 100 - discount
    if margin_after_discount < preferences.min_margin_pct:
        discount = 100 - preferences.min_margin_pct
    
    return round(discount, 1)


def _estimate_clear_time(
    quantity: int,
    base_velocity: float,
    discount_pct: float
) -> int:
    """
    Estimate days to clear inventory at discounted rate.
    
    Assumes: uplift = elasticity_multiplier * discount_pct
    """
    uplift_factor = 1 + (settings.PROMOTION_ELASTICITY_MULTIPLIER * discount_pct / 100)
    boosted_velocity = base_velocity * uplift_factor
    
    if boosted_velocity <= 0:
        return 999  # Can't clear
    
    clear_days = int(quantity / boosted_velocity)
    return max(1, clear_days)


def _generate_promo_copy(
    item: NearExpiryItem,
    event: CalendarEvent,
    discount_pct: float
) -> str:
    """Generate marketing copy for promotion."""
    templates = [
        f"{event.title} Special: {discount_pct:.0f}% off {item.name}! Limited time offer.",
        f"Celebrate {event.title} with {discount_pct:.0f}% savings on {item.name}!",
        f"{item.name} on sale for {event.title} - Save {discount_pct:.0f}%!",
        f"Don't miss out: {discount_pct:.0f}% off {item.name} during {event.title}!"
    ]
    
    # Simple selection based on discount level
    if discount_pct >= 30:
        return templates[3]  # Urgent copy
    elif discount_pct >= 20:
        return templates[1]  # Celebrate
    else:
        return templates[0]  # Standard


def _compute_confidence(
    days_to_expiry: int,
    clear_days: int,
    discount_pct: float
) -> str:
    """
    Determine confidence level for promotion recommendation.
    
    Logic:
    - High: Clear days << days to expiry, moderate discount
    - Medium: Reasonable margin
    - Low: Tight timing or excessive discount
    """
    safety_margin = days_to_expiry - clear_days
    
    if safety_margin >= 3 and discount_pct <= 25:
        return "high"
    elif safety_margin >= 1 and discount_pct <= 35:
        return "medium"
    else:
        return "low"
