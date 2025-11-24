# File: app/routes/restock.py
"""
Purpose: FastAPI routes for AI-powered restocking strategy.
Handles restocking recommendation requests with multiple optimization strategies.

Endpoints:
- POST /strategy: Calculate optimal restocking strategy
"""

from fastapi import APIRouter, HTTPException, status
import structlog
from app.schemas.restock_schema import RestockRequest, RestockResponse
from app.services.restock_service import compute_restock_strategy

logger = structlog.get_logger()

router = APIRouter(prefix="/restock", tags=["Restock"])


@router.post("/strategy", response_model=RestockResponse)
async def calculate_restock_strategy(request: RestockRequest) -> RestockResponse:
    """
    Calculate optimal restocking strategy based on budget and goal.
    
    Supports three optimization strategies:
    - profit: Maximize profit margin × demand
    - volume: Maximize inventory turnover and units
    - balanced: 50/50 hybrid approach
    
    Returns recommended products with quantities, costs, and reasoning.
    
    Example request:
    ```json
    {
      "shop_id": "SHOP-001",
      "budget": 5000,
      "goal": "profit",
      "products": [
        {
          "product_id": 1,
          "name": "UFC Banana Catsup",
          "price": 18,
          "cost": 12,
          "stock": 5,
          "category": "Condiments",
          "avg_daily_sales": 12,
          "profit_margin": 0.33
        }
      ],
      "restock_days": 14
    }
    ```
    
    Example response:
    ```json
    {
      "strategy": "profit",
      "shop_id": "SHOP-001",
      "budget": 5000,
      "items": [
        {
          "product_id": 1,
          "name": "UFC Banana Catsup",
          "qty": 163,
          "unit_cost": 12,
          "total_cost": 1956,
          "expected_profit": 978,
          "expected_revenue": 2934,
          "days_of_stock": 13.6,
          "priority_score": 108.0,
          "reasoning": "High profit margin (33.3%), 12.0 units/day, urgency: 3.0x"
        }
      ],
      "totals": {
        "total_items": 1,
        "total_qty": 163,
        "total_cost": 1956,
        "budget_used_pct": 39.12,
        "expected_revenue": 2934,
        "expected_profit": 978,
        "expected_roi": 50.0,
        "avg_days_of_stock": 13.6
      },
      "reasoning": [
        "Strategy: Profit Maximization - Prioritize high-margin, fast-moving items",
        "Budget: ₱5,000.00",
        "Target: 14 days of stock",
        "Selected 1 products with highest profit potential"
      ]
    }
    ```
    """
    try:
        logger.info(
            "restock_request",
            shop_id=request.shop_id,
            budget=request.budget,
            goal=request.goal,
            products=len(request.products)
        )
        
        # Validate budget
        if request.budget <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Budget must be greater than 0"
            )
        
        # Validate products
        if not request.products:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one product must be provided"
            )
        
        # Compute strategy
        response = compute_restock_strategy(request)
        
        logger.info(
            "restock_success",
            items_selected=len(response.items),
            total_cost=response.totals.total_cost,
            expected_profit=response.totals.expected_profit
        )
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("restock_error", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate restocking strategy: {str(e)}"
        )
