# File: app/schemas/forecast_schema.py
"""
Purpose: Pydantic models for forecasting and analytics endpoints.
Defines schemas for demand forecasting, sales insights, and promotion planning.

Key schemas:
- ForecastRequest: Input for demand forecasting
- ForecastResponse: Prediction results with confidence intervals
- InsightsRequest: Analytics dashboard data request
- InsightsResponse: Time-series data and trends
- PromotionRequest: Near-expiry + calendar event pairing input
- PromotionResponse: Generated promotion recommendations

Optimization notes:
- Minimal validation overhead using Field constraints
- Nested models allow for clean separation of concerns
- All datetime handling uses ISO strings for API compatibility
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator
from enum import Enum


class ForecastMethod(str, Enum):
    """Supported forecasting algorithms."""
    AUTO = "auto"  # Automatically select best method
    LINEAR = "linear"  # Linear regression
    PROPHET = "prophet"  # Facebook Prophet (if available)
    XGBOOST = "xgboost"  # XGBoost regressor
    MOVING_AVG = "moving_avg"  # Simple moving average fallback


class Granularity(str, Enum):
    """Time series granularity options."""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class ForecastRequest(BaseModel):
    """
    Request for demand forecasting endpoint.
    
    Supports both single-product and batch forecasting.
    If product_list provided, forecasts all products in batch.
    """
    shop_id: str
    product_id: Optional[str] = None  # Single product
    product_list: Optional[List[str]] = None  # Batch forecasting
    sales: List[Dict[str, Any]] = Field(..., description="Historical sales: [{date, qty, product_id?}]")
    periods: int = Field(14, ge=1, le=90, description="Number of periods to forecast")
    model: ForecastMethod = ForecastMethod.AUTO
    confidence_interval: float = Field(0.95, ge=0.5, le=0.99)


class Prediction(BaseModel):
    """
    Single forecasted data point.
    
    Fields:
    - date: Prediction date (ISO string)
    - predicted_qty: Point forecast
    - lower_ci: Lower confidence interval bound (optional)
    - upper_ci: Upper confidence interval bound (optional)
    """
    date: str
    predicted_qty: float = Field(ge=0.0)
    lower_ci: Optional[float] = None
    upper_ci: Optional[float] = None


class ProductForecast(BaseModel):
    """
    Forecast results for a single product.
    
    Includes predictions array, model metadata, and feature importance if available.
    """
    product_id: str
    predictions: List[Prediction]
    method: str  # Actual method used
    model_version: str  # Model identifier with timestamp
    trained_at: Optional[str] = None  # ISO timestamp of model training
    feature_importance: Optional[Dict[str, float]] = None  # If explainability available
    rmse: Optional[float] = None  # Model accuracy metric on validation set


class ForecastResponse(BaseModel):
    """
    Complete forecast response (supports batch results).
    """
    forecasts: List[ProductForecast]
    meta: Dict[str, Any] = Field(
        description="Metadata: shop_id, forecast_date, total_products, cache_hit"
    )


class InsightsRequest(BaseModel):
    """
    Request for sales insights and analytics dashboard.
    
    Provides time-series aggregation, trend detection, and top-K analysis.
    """
    shop_id: str
    sales: List[Dict[str, Any]] = Field(..., description="Sales records: [{product_id, date, qty, revenue}]")
    range: Dict[str, str] = Field(..., description="Date range: {start: ISO, end: ISO}")
    granularity: Granularity = Granularity.DAILY
    top_k: int = Field(10, ge=1, le=100, description="Number of top items to return")
    
    @field_validator('range')
    @classmethod
    def validate_range(cls, v):
        """Ensure range contains valid start and end dates."""
        if 'start' not in v or 'end' not in v:
            raise ValueError('range must contain start and end keys')
        try:
            datetime.fromisoformat(v['start'].replace('Z', '+00:00'))
            datetime.fromisoformat(v['end'].replace('Z', '+00:00'))
        except ValueError:
            raise ValueError('range dates must be valid ISO format')
        return v


class TimeSeriesPoint(BaseModel):
    """
    Single aggregated time-series data point.
    """
    date: str
    total_sales: float
    total_revenue: float
    moving_avg_7: Optional[float] = None  # 7-period moving average
    moving_avg_30: Optional[float] = None  # 30-period moving average


class TopItem(BaseModel):
    """
    Top-performing product with trend indicator.
    """
    product_id: str
    name: Optional[str] = None
    total_qty: float
    total_revenue: Optional[float] = None
    trend: str  # "increasing", "decreasing", "stable"
    trend_slope: Optional[float] = None  # Linear trend coefficient


class InsightsResponse(BaseModel):
    """
    Complete analytics response for dashboard visualization.
    
    Returns:
    - Time-series data ready for charting
    - Top-K products by volume/revenue
    - Seasonality hints (day-of-week, monthly patterns)
    - Actionable recommendations
    """
    series: List[TimeSeriesPoint]
    top_items: List[TopItem]
    seasonality: Dict[str, Any] = Field(
        description="Detected patterns: {day_of_week: {...}, monthly: {...}}"
    )
    recommendations: List[str] = Field(description="Actionable insights in plain text")
    meta: Dict[str, Any]


class CalendarEvent(BaseModel):
    """
    Upcoming calendar event for promotion pairing.
    """
    id: str
    date: str  # ISO date
    title: str
    audience: Optional[str] = None  # Target demographic
    event_type: Optional[str] = None  # holiday, sale, season, etc.


class NearExpiryItem(BaseModel):
    """
    Product near expiration for promotion planning.
    """
    product_id: str
    name: str
    expiry_date: str  # ISO date
    quantity: int
    price: float
    categories: Optional[List[str]] = None


class PromotionPreferences(BaseModel):
    """
    Business constraints for promotion generation.
    """
    discount_max_pct: float = Field(40.0, ge=0.0, le=100.0)
    min_margin_pct: float = Field(10.0, ge=0.0, le=100.0)
    max_promo_duration_days: int = Field(7, ge=1, le=30)


class PromotionRequest(BaseModel):
    """
    Request for promotion planning endpoint.
    
    Pairs near-expiry products with upcoming calendar events to generate targeted promotions.
    """
    shop_id: str
    items: List[NearExpiryItem] = Field(..., min_length=1)
    calendar_events: List[CalendarEvent] = Field(..., min_length=1)
    preferences: Optional[PromotionPreferences] = None


class GeneratedPromotion(BaseModel):
    """
    Single generated promotion recommendation.
    
    Includes pairing rationale, pricing strategy, and expected impact.
    """
    event_id: str
    event_title: str
    product_id: str
    product_name: str
    suggested_discount_pct: float = Field(ge=0.0, le=100.0)
    promo_copy: str = Field(description="Marketing copy for the promotion")
    start_date: str  # ISO date
    end_date: str  # ISO date
    expected_clear_days: int = Field(description="Estimated days to clear inventory at promoted rate")
    projected_sales_lift: float = Field(description="Expected % increase in sales velocity")
    confidence: str = Field(description="high, medium, low")
    reasoning: str = Field(description="Why this pairing makes sense")


class PromotionResponse(BaseModel):
    """
    Complete promotion planning response.
    
    Returns all generated promotions sorted by confidence and impact.
    """
    promotions: List[GeneratedPromotion]
    meta: Dict[str, Any] = Field(
        description="Metadata: total_items, total_events, promotions_generated, analysis_date"
    )
