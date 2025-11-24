# File: app/schemas/inventory_schema.py
"""
Purpose: Pydantic models for inventory-related API endpoints.
Defines request/response schemas for at-risk detection and promotion planning.

Key schemas:
- InventoryItem: Single product inventory record
- SalesRecord: Historical sales data point
- AtRiskRequest: Input for at-risk detection endpoint
- AtRiskItem: Single at-risk product with reasons and recommendations
- AtRiskResponse: Complete response with all flagged items

Performance considerations:
- Uses list validation which is O(n) per field
- Provides computed fields for derived metrics
- Validates date strings and converts to datetime internally
"""

from datetime import date, datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator, computed_field
from enum import Enum


class RiskReason(str, Enum):
    """Enumeration of possible risk flags for inventory items."""
    LOW_STOCK = "low_stock"
    NEAR_EXPIRY = "near_expiry"
    SLOW_MOVING = "slow_moving"


class InventoryItem(BaseModel):
    """
    Single product inventory record.
    
    Fields:
    - product_id: Unique identifier for the product
    - sku: Stock keeping unit code
    - name: Product name
    - quantity: Current stock quantity
    - expiry_date: Optional expiration date (ISO format)
    - price: Unit price for promotion calculations
    - categories: Optional list of product categories
    """
    product_id: str
    sku: str
    name: str
    quantity: int = Field(ge=0, description="Current stock quantity")
    expiry_date: Optional[str] = None  # ISO date string
    price: Optional[float] = Field(None, ge=0)
    categories: Optional[List[str]] = None
    
    @field_validator('expiry_date')
    @classmethod
    def validate_expiry_date(cls, v):
        """Ensure expiry_date is valid ISO date if provided."""
        if v is not None:
            try:
                datetime.fromisoformat(v.replace('Z', '+00:00'))
            except ValueError:
                raise ValueError('expiry_date must be valid ISO date string')
        return v


class SalesRecord(BaseModel):
    """
    Historical sales data point.
    
    Fields:
    - product_id: Product identifier matching InventoryItem
    - date: Sale date in ISO format
    - qty: Quantity sold
    - revenue: Optional revenue generated
    """
    product_id: str
    date: str  # ISO date string
    qty: float = Field(ge=0, description="Quantity sold")
    revenue: Optional[float] = Field(None, ge=0)
    
    @field_validator('date')
    @classmethod
    def validate_date(cls, v):
        """Ensure date is valid ISO date."""
        try:
            datetime.fromisoformat(v.replace('Z', '+00:00'))
        except ValueError:
            raise ValueError('date must be valid ISO date string')
        return v


class AtRiskThresholds(BaseModel):
    """
    Configurable thresholds for at-risk detection.
    
    All thresholds have sensible defaults from config but can be overridden per request.
    """
    low_stock: int = Field(10, ge=0, description="Quantity threshold for low stock")
    expiry_days: int = Field(7, ge=0, description="Days until expiry to flag as near-expiry")
    slow_moving_window: int = Field(30, ge=1, description="Days to analyze for slow-moving detection")
    slow_moving_threshold: float = Field(0.5, ge=0, description="Min avg daily sales to avoid slow-moving flag")


class AtRiskRequest(BaseModel):
    """
    Request payload for /at-risk endpoint.
    
    Contains shop context, current inventory snapshot, historical sales, and detection thresholds.
    Maximum payload size is validated at endpoint level to prevent resource exhaustion.
    """
    shop_id: str
    inventory: List[InventoryItem] = Field(..., min_length=1, description="Current inventory snapshot")
    sales: List[SalesRecord] = Field(default_factory=list, description="Historical sales records")
    thresholds: Optional[AtRiskThresholds] = None


class RecommendedAction(BaseModel):
    """
    Actionable recommendations for an at-risk product.
    
    Fields:
    - action_type: Primary recommended action (restock, discount, bundle, etc.)
    - restock_qty: Suggested restock quantity if applicable
    - discount_range: Suggested discount percentage range [min, max]
    - promotion_timing: Suggested timeframe for promotion
    - reasoning: Human-readable explanation
    """
    action_type: str  # e.g., "restock", "discount", "bundle", "clearance"
    restock_qty: Optional[int] = None
    discount_range: Optional[List[float]] = None  # [min_pct, max_pct]
    promotion_timing: Optional[str] = None  # e.g., "within 7 days"
    reasoning: str


class AtRiskItem(BaseModel):
    """
    Single at-risk product with computed risk metrics.
    
    Fields:
    - product_id, sku, name: Product identifiers
    - reasons: List of risk flags (low_stock, near_expiry, slow_moving)
    - score: Normalized risk score 0.0-1.0 (higher = more urgent)
    - current_quantity: Current stock level
    - days_to_expiry: Days until expiration (if applicable)
    - avg_daily_sales: Computed average daily sales in analysis window
    - recommended_action: Actionable recommendation object
    """
    product_id: str
    sku: str
    name: str
    reasons: List[RiskReason]
    score: float = Field(ge=0.0, le=1.0, description="Normalized risk score")
    current_quantity: int
    days_to_expiry: Optional[int] = None
    avg_daily_sales: Optional[float] = None
    recommended_action: RecommendedAction


class AtRiskResponse(BaseModel):
    """
    Complete response from /at-risk endpoint.
    
    Returns all flagged items sorted by risk score (descending) and metadata about analysis.
    """
    at_risk: List[AtRiskItem] = Field(description="At-risk products sorted by score (high to low)")
    meta: Dict[str, Any] = Field(
        description="Metadata: total_products, flagged_count, analysis_date, thresholds_used"
    )
