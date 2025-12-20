# File: app/schemas/restock_schema.py
"""
Purpose: Pydantic models for AI-powered restocking strategy endpoints.
Defines request/response schemas for profit maximization, volume optimization,
and balanced growth recommendations.

Key schemas:
- ProductInput: Single product with inventory and sales data
- RestockRequest: Input for strategy calculation
- RestockItem: Individual product recommendation
- RestockResponse: Complete strategy with reasoning and totals

Business rules:
- Budget constraints enforced
- Minimum order quantities considered
- Stock levels respected
- Profit margins validated
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator
from enum import Enum


class RestockGoal(str, Enum):
    """Restocking strategy types."""
    PROFIT = "profit"
    VOLUME = "volume"
    BALANCED = "balanced"


class ProductInput(BaseModel):
    """
    Single product with inventory and sales data for restocking analysis.
    
    Fields:
    - product_id: Unique identifier (can be string or int)
    - name: Product display name
    - price: Selling price per unit
    - cost: Purchase/acquisition cost per unit
    - stock: Current inventory quantity
    - category: Product category (optional)
    - avg_daily_sales: Average units sold per day
    - profit_margin: Calculated profit margin (0.0 to 1.0)
    - min_order_qty: Minimum order quantity (default: 1)
    - max_order_qty: Maximum order quantity (optional)
    """
    product_id: str | int
    name: str
    price: float = Field(gt=0, description="Selling price per unit")
    cost: float = Field(gt=0, description="Cost per unit")
    stock: int = Field(ge=0, description="Current inventory level")
    category: Optional[str] = None
    avg_daily_sales: float = Field(ge=0, description="Average daily sales velocity")
    profit_margin: float = Field(ge=0.0, le=1.0, description="Profit margin ratio")
    min_order_qty: int = Field(default=1, ge=1, description="Minimum order quantity")
    max_order_qty: Optional[int] = Field(default=None, ge=1, description="Maximum order quantity")
    
    @field_validator('profit_margin')
    @classmethod
    def validate_profit_margin(cls, v, info):
        """Ensure profit margin is consistent with price and cost."""
        # Allow some tolerance for floating point arithmetic
        if 'price' in info.data and 'cost' in info.data:
            expected = (info.data['price'] - info.data['cost']) / info.data['price']
            if abs(v - expected) > 0.01:  # 1% tolerance
                # Auto-calculate if mismatch
                return max(0.0, min(1.0, expected))
        return v


class RestockRequest(BaseModel):
    """
    Request payload for /restock/strategy endpoint.
    
    Contains shop context, budget constraint, optimization goal, and product list.
    Supports real-world context adjustments (weather, holidays, payday cycles).
    """
    shop_id: str
    budget: float = Field(gt=0, description="Total budget for restocking")
    goal: RestockGoal = Field(default=RestockGoal.PROFIT, description="Optimization strategy")
    products: List[ProductInput] = Field(..., min_length=1, description="Products to analyze")
    restock_days: int = Field(default=14, ge=1, le=90, description="Days of stock to maintain")
    
    # Context-aware fields for demand adjustment
    is_payday: bool = Field(
        default=False,
        description="Whether it's a payday period (typically increases demand by 20%)"
    )
    upcoming_holiday: Optional[str] = Field(
        default=None,
        description="Upcoming holiday or sale event (e.g., 'christmas', '11.11') - increases demand by 50%"
    )
    
    @field_validator('products')
    @classmethod
    def validate_products(cls, v):
        """Ensure products list is not too large."""
        if len(v) > 1000:
            raise ValueError("Maximum 1000 products allowed per request")
        return v


class RestockItem(BaseModel):
    """
    Individual product restocking recommendation.
    
    Fields:
    - product_id: Product identifier
    - name: Product name
    - qty: Recommended quantity to purchase
    - unit_cost: Cost per unit
    - total_cost: Total cost for this item (qty × unit_cost)
    - expected_profit: Expected profit from selling these units
    - expected_revenue: Expected revenue (qty × price)
    - days_of_stock: How many days this quantity will last
    - priority_score: Algorithm-specific priority score
    - reasoning: Why this product was selected
    """
    product_id: str | int
    name: str
    qty: int = Field(ge=0)
    unit_cost: float
    total_cost: float = Field(ge=0)
    expected_profit: float = Field(ge=0)
    expected_revenue: float = Field(ge=0)
    days_of_stock: float = Field(ge=0)
    priority_score: float
    reasoning: Optional[str] = None


class RestockTotals(BaseModel):
    """
    Aggregate totals for restocking strategy.
    """
    total_items: int = Field(ge=0, description="Number of different products")
    total_qty: int = Field(ge=0, description="Total units to purchase")
    total_cost: float = Field(ge=0, description="Total cost")
    budget_used_pct: float = Field(ge=0, le=100, description="Percentage of budget used")
    expected_revenue: float = Field(ge=0)
    expected_profit: float = Field(ge=0)
    expected_roi: float = Field(description="Return on investment %")
    avg_days_of_stock: float = Field(ge=0)


class RestockResponse(BaseModel):
    """
    Complete restocking strategy response.
    
    Contains recommended items, totals, and reasoning for the strategy.
    """
    strategy: RestockGoal
    shop_id: str
    budget: float
    items: List[RestockItem]
    totals: RestockTotals
    reasoning: List[str] = Field(description="Strategy explanation points")
    warnings: Optional[List[str]] = Field(default_factory=list)
    meta: Dict[str, Any] = Field(default_factory=dict)
