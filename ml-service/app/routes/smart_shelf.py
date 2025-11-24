# File: app/routes/smart_shelf.py
"""
Purpose: FastAPI routes for SmartShelf endpoints.
Handles all smart-shelf related API requests with validation and error handling.

Endpoints:
- POST /at-risk: At-risk inventory detection
- POST /promotions: Promotion planning
- POST /insights: Sales analytics
- POST /forecast: Demand forecasting
"""

from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any
import structlog
from app.schemas.inventory_schema import AtRiskRequest, AtRiskResponse
from app.schemas.forecast_schema import (
    ForecastRequest,
    ForecastResponse,
    InsightsRequest,
    InsightsResponse,
    PromotionRequest,
    PromotionResponse
)
from app.services.inventory_service import compute_risk_scores
from app.services.forecast_service import forecast_demand, batch_forecast
from app.services.insights_service import generate_insights
from app.services.promotion_service import generate_promotions
from app.utils.pandas_utils import prepare_sales_dataframe
from app.config import settings

logger = structlog.get_logger()

router = APIRouter(prefix="/smart-shelf", tags=["SmartShelf"])


@router.post("/at-risk", response_model=AtRiskResponse)
async def detect_at_risk_inventory(request: AtRiskRequest) -> AtRiskResponse:
    """
    Detect at-risk inventory items (low stock, near-expiry, slow-moving).
    
    Returns prioritized list of products needing attention with actionable recommendations.
    """
    try:
        logger.info("at_risk_request", shop_id=request.shop_id, inventory_count=len(request.inventory))
        
        # Validate payload size
        if len(request.inventory) > settings.MAX_PAYLOAD_ROWS:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Inventory list exceeds maximum size of {settings.MAX_PAYLOAD_ROWS}"
            )
        
        # Use default thresholds if not provided
        thresholds = request.thresholds or AtRiskRequest.__fields__['thresholds'].default_factory()
        
        # Compute risk scores
        at_risk_items = compute_risk_scores(
            inventory=request.inventory,
            sales=request.sales,
            thresholds=thresholds
        )
        
        # Build response
        response = AtRiskResponse(
            at_risk=at_risk_items,
            meta={
                "shop_id": request.shop_id,
                "total_products": len(request.inventory),
                "flagged_count": len(at_risk_items),
                "analysis_date": "now",
                "thresholds_used": thresholds.dict()
            }
        )
        
        logger.info("at_risk_complete", flagged=len(at_risk_items))
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("at_risk_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process at-risk detection"
        )


@router.post("/promotions", response_model=PromotionResponse)
async def plan_promotions(request: PromotionRequest) -> PromotionResponse:
    """
    Generate promotion recommendations by pairing near-expiry products with calendar events.
    
    Returns suggested discounts, timing, and marketing copy.
    """
    try:
        logger.info(
            "promotions_request",
            shop_id=request.shop_id,
            items_count=len(request.items),
            events_count=len(request.calendar_events)
        )
        
        # Use default preferences if not provided
        preferences = request.preferences or PromotionRequest.__fields__['preferences'].default
        
        # Generate promotions
        promotions = generate_promotions(
            shop_id=request.shop_id,
            items=request.items,
            events=request.calendar_events,
            preferences=preferences
        )
        
        # Build response
        response = PromotionResponse(
            promotions=promotions,
            meta={
                "shop_id": request.shop_id,
                "total_items": len(request.items),
                "total_events": len(request.calendar_events),
                "promotions_generated": len(promotions),
                "analysis_date": "now"
            }
        )
        
        logger.info("promotions_complete", generated=len(promotions))
        
        return response
    
    except Exception as e:
        logger.error("promotions_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate promotions"
        )


@router.post("/insights", response_model=InsightsResponse)
async def get_sales_insights(request: InsightsRequest) -> InsightsResponse:
    """
    Generate sales analytics and dashboard insights.
    
    Returns time-series data, top products, trends, and recommendations.
    """
    try:
        logger.info("insights_request", shop_id=request.shop_id, sales_count=len(request.sales))
        
        # Validate payload
        if len(request.sales) > settings.MAX_PAYLOAD_ROWS:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Sales data exceeds maximum size of {settings.MAX_PAYLOAD_ROWS}"
            )
        
        # Prepare sales DataFrame
        sales_df = prepare_sales_dataframe(request.sales)
        
        # Generate insights
        insights = generate_insights(
            shop_id=request.shop_id,
            sales_df=sales_df,
            start_date=request.range['start'],
            end_date=request.range['end'],
            granularity=request.granularity,
            top_k=request.top_k
        )
        
        logger.info("insights_complete")
        
        return insights
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("insights_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate insights"
        )


@router.post("/forecast", response_model=ForecastResponse)
async def forecast_demand_endpoint(request: ForecastRequest) -> ForecastResponse:
    """
    Forecast future demand for products.
    
    Supports both single product and batch forecasting.
    """
    try:
        logger.info("forecast_request", shop_id=request.shop_id, periods=request.periods)
        
        # Prepare sales data
        sales_df = prepare_sales_dataframe(request.sales)
        
        if sales_df.empty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid sales data provided"
            )
        
        # Determine if single or batch forecast
        forecasts = []
        
        if request.product_id:
            # Single product forecast
            product_sales = sales_df[sales_df['product_id'] == request.product_id]
            
            if len(product_sales) < 2:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient data for product {request.product_id}"
                )
            
            forecast = forecast_demand(
                shop_id=request.shop_id,
                product_id=request.product_id,
                sales_df=product_sales,
                periods=request.periods,
                method=request.model.value,
                confidence_interval=request.confidence_interval
            )
            
            forecasts.append(forecast)
        
        elif request.product_list:
            # Batch forecast
            forecasts = batch_forecast(
                shop_id=request.shop_id,
                product_ids=request.product_list,
                sales_df=sales_df,
                periods=request.periods,
                method=request.model.value
            )
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either product_id or product_list must be provided"
            )
        
        # Build response
        response = ForecastResponse(
            forecasts=forecasts,
            meta={
                "shop_id": request.shop_id,
                "forecast_date": "now",
                "total_products": len(forecasts),
                "cache_hit": False  # Simplified
            }
        )
        
        logger.info("forecast_complete", products=len(forecasts))
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("forecast_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate forecast: {str(e)}"
        )
