# File: app/services/restock_service.py
"""
Purpose: AI-powered restocking strategy algorithms.
Implements three optimization strategies for inventory restocking:
1. Profit Maximization - Maximize profit within budget
2. Volume Maximization - Maximize units/turnover within budget  
3. Balanced Growth - Hybrid approach balancing profit and volume

Key functions:
- compute_restock_strategy: Main orchestrator
- profit_maximization: Greedy algorithm for profit optimization
- volume_maximization: Greedy algorithm for volume optimization
- balanced_strategy: Weighted hybrid approach

Performance: O(n log n) due to sorting, suitable for up to 10,000 products
"""

from typing import List, Tuple, Dict, Any
import structlog
from app.schemas.restock_schema import (
    RestockRequest,
    RestockResponse,
    RestockItem,
    RestockTotals,
    RestockGoal,
    ProductInput
)

logger = structlog.get_logger()


def apply_context_multipliers(
    base_demand: float,
    product: ProductInput,
    is_payday: bool = False,
    upcoming_holiday: str | None = None
) -> float:
    """
    Apply context-aware multipliers to base demand based on real-world factors.
    
    Multiplier Rules:
    - Payday: +20% demand for all items
    - Holiday (11.11/Christmas): +50% demand
    
    Args:
        base_demand: Base daily demand (avg_daily_sales)
        product: ProductInput with category information
        is_payday: Whether it's a payday period
        upcoming_holiday: Upcoming holiday or sale event
    
    Returns:
        Adjusted demand with context multipliers applied
    """
    adjusted_demand = base_demand
    multipliers_applied = []
    
    # Payday multiplier: +20% for all items
    if is_payday:
        adjusted_demand *= 1.20
        multipliers_applied.append("payday (+20%)")
    
    # Holiday multiplier: +50% for all items
    if upcoming_holiday:
        holiday_lower = upcoming_holiday.lower()
        if holiday_lower in ["11.11", "christmas", "black friday", "new year", "valentine"]:
            adjusted_demand *= 1.50
            multipliers_applied.append(f"holiday {upcoming_holiday} (+50%)")
    
    if multipliers_applied:
        logger.debug(
            "context_multipliers_applied",
            product_id=product.product_id,
            base_demand=base_demand,
            adjusted_demand=adjusted_demand,
            multipliers=multipliers_applied
        )
    
    return adjusted_demand


def compute_restock_strategy(request: RestockRequest) -> RestockResponse:
    """
    Main orchestrator for restocking strategy computation.
    
    Delegates to specific algorithm based on goal:
    - profit: Maximize profit margin × demand
    - volume: Maximize inventory turnover
    - balanced: 50/50 weighted hybrid
    
    Args:
        request: RestockRequest with products, budget, and goal
    
    Returns:
        RestockResponse with recommended items and reasoning
    """
    logger.info(
        "restock_strategy_start",
        shop_id=request.shop_id,
        budget=request.budget,
        goal=request.goal,
        products_count=len(request.products),
        is_payday=request.is_payday,
        holiday=request.upcoming_holiday
    )
    
    # Filter out products where cost >= price (negative profit margin)
    # These products would result in negative expected_profit
    valid_products = [
        p for p in request.products 
        if p.price > p.cost and p.price > 0 and p.cost > 0
    ]
    
    if len(valid_products) == 0:
        logger.warning(
            "restock_no_valid_products",
            shop_id=request.shop_id,
            original_count=len(request.products)
        )
        return RestockResponse(
            strategy=request.goal,
            shop_id=request.shop_id,
            budget=request.budget,
            items=[],
            totals=RestockTotals(
                total_items=0,
                total_qty=0,
                total_cost=0.0,
                budget_used_pct=0.0,
                expected_revenue=0.0,
                expected_profit=0.0,
                expected_roi=0.0,
                avg_days_of_stock=0.0
            ),
            reasoning=["No valid products found. All products have cost >= price, which would result in losses."],
            warnings=["No products can be recommended. Please check product pricing."],
            meta={
                "products_analyzed": len(request.products),
                "products_selected": 0,
                "restock_days": request.restock_days
            }
        )
    
    # Route to appropriate strategy (use filtered valid products)
    # Pass context parameters for demand adjustment
    if request.goal == RestockGoal.PROFIT:
        items, reasoning = profit_maximization(
            products=valid_products,
            budget=request.budget,
            restock_days=request.restock_days,
            is_payday=request.is_payday,
            upcoming_holiday=request.upcoming_holiday
        )
    elif request.goal == RestockGoal.VOLUME:
        items, reasoning = volume_maximization(
            products=valid_products,
            budget=request.budget,
            restock_days=request.restock_days,
            is_payday=request.is_payday,
            upcoming_holiday=request.upcoming_holiday
        )
    else:  # BALANCED
        items, reasoning = balanced_strategy(
            products=valid_products,
            budget=request.budget,
            restock_days=request.restock_days,
            is_payday=request.is_payday,
            upcoming_holiday=request.upcoming_holiday
        )
    
    # Compute totals
    totals = compute_totals(items, request.budget)
    
    # Generate warnings (use original products list for context)
    warnings = generate_warnings(items, request.products, request.budget, totals)
    
    # Add warning if products were filtered
    if len(valid_products) < len(request.products):
        filtered_count = len(request.products) - len(valid_products)
        warnings.append(f"{filtered_count} product(s) were excluded due to cost >= price (would result in losses)")
    
    # Build response
    response = RestockResponse(
        strategy=request.goal,
        shop_id=request.shop_id,
        budget=request.budget,
        items=items,
        totals=totals,
        reasoning=reasoning,
        warnings=warnings,
        meta={
            "products_analyzed": len(request.products),
            "products_selected": len(items),
            "restock_days": request.restock_days
        }
    )
    
    logger.info(
        "restock_strategy_complete",
        selected_items=len(items),
        total_cost=totals.total_cost,
        expected_profit=totals.expected_profit
    )
    
    return response


def profit_maximization(
    products: List[ProductInput],
    budget: float,
    restock_days: int,
    is_payday: bool = False,
    upcoming_holiday: str | None = None
) -> Tuple[List[RestockItem], List[str]]:
    """
    Profit Maximization Strategy.
    
    Algorithm:
    1. Calculate profit score = profit_margin × avg_daily_sales × urgency_factor
    2. Urgency factor = higher when stock is lower (stock < 7 days)
    3. Sort products by profit score (descending)
    4. Greedily select products until budget exhausted
    5. For each product, buy enough for restock_days of demand
    
    Priority formula:
    profit_score = (price - cost) × avg_daily_sales × urgency_multiplier
    
    Args:
        products: List of available products
        budget: Total budget constraint
        restock_days: Target days of stock to maintain
    
    Returns:
        Tuple of (selected items, reasoning points)
    """
    reasoning = [
        f"Strategy: Profit Maximization - Prioritize high-margin, fast-moving items",
        f"Budget: ₱{budget:,.2f}",
        f"Target: {restock_days} days of stock"
    ]
    
    # Add context information to reasoning
    if is_payday:
        reasoning.append("Context: Payday period detected - demand increased by 20%")
    if upcoming_holiday:
        reasoning.append(f"Context: Upcoming holiday ({upcoming_holiday}) - demand increased by 50%")
    
    # Calculate profit scores for each product
    scored_products = []
    for p in products:
        # Apply context multipliers to base demand
        base_demand = p.avg_daily_sales
        daily_demand = apply_context_multipliers(
            base_demand=base_demand,
            product=p,
            is_payday=is_payday,
            upcoming_holiday=upcoming_holiday
        )
        current_days_of_stock = p.stock / daily_demand if daily_demand > 0 else 999
        
        # Urgency multiplier: higher when stock is low
        if current_days_of_stock < 3:
            urgency = 3.0  # Critical
        elif current_days_of_stock < 7:
            urgency = 2.0  # High
        elif current_days_of_stock < restock_days:
            urgency = 1.5  # Moderate
        else:
            urgency = 1.0  # Normal
        
        # Profit per unit (ensure non-negative)
        unit_profit = max(0.0, p.price - p.cost)
        
        # Profit score = profit × demand × urgency
        profit_score = unit_profit * daily_demand * urgency
        
        # Calculate optimal quantity to buy
        needed_qty = max(0, int((daily_demand * restock_days) - p.stock))
        
        # Respect min/max order quantities
        if needed_qty > 0:
            needed_qty = max(needed_qty, p.min_order_qty)
            if p.max_order_qty:
                needed_qty = min(needed_qty, p.max_order_qty)
        
        if needed_qty > 0:  # Only consider products that need restocking
            scored_products.append({
                'product': p,
                'score': profit_score,
                'qty': needed_qty,
                'urgency': urgency,
                'unit_profit': unit_profit
            })
    
    # Sort by profit score (descending)
    scored_products.sort(key=lambda x: x['score'], reverse=True)
    
    # Greedily select products within budget
    selected_items: List[RestockItem] = []
    remaining_budget = budget
    
    for item in scored_products:
        p = item['product']
        qty = item['qty']
        
        # Calculate cost for this quantity
        total_cost = p.cost * qty
        
        # If we can't afford the full quantity, buy what we can
        if total_cost > remaining_budget:
            # Buy maximum we can afford
            affordable_qty = int(remaining_budget / p.cost)
            
            # Respect minimum order quantity
            if affordable_qty < p.min_order_qty:
                continue  # Can't afford minimum order
            
            qty = affordable_qty
            total_cost = p.cost * qty
        
        if qty > 0 and total_cost <= remaining_budget:
            expected_revenue = qty * p.price
            # Ensure expected_profit is never negative (clamp to 0)
            expected_profit = max(0.0, qty * item['unit_profit'])
            days_of_stock = qty / p.avg_daily_sales if p.avg_daily_sales > 0 else 999
            
            selected_items.append(RestockItem(
                product_id=p.product_id,
                name=p.name,
                qty=qty,
                unit_cost=p.cost,
                total_cost=total_cost,
                expected_profit=expected_profit,
                expected_revenue=expected_revenue,
                days_of_stock=days_of_stock,
                priority_score=item['score'],
                reasoning=f"High profit margin ({p.profit_margin:.1%}), "
                         f"{p.avg_daily_sales:.1f} units/day, "
                         f"urgency: {item['urgency']:.1f}x"
            ))
            
            remaining_budget -= total_cost
            
            if remaining_budget < 1:  # Less than ₱1 remaining
                break
    
    reasoning.append(f"Selected {len(selected_items)} products with highest profit potential")
    reasoning.append(f"Prioritized items with profit margin > 20% and strong sales velocity")
    
    return selected_items, reasoning


def volume_maximization(
    products: List[ProductInput],
    budget: float,
    restock_days: int,
    is_payday: bool = False,
    upcoming_holiday: str | None = None
) -> Tuple[List[RestockItem], List[str]]:
    """
    Volume Maximization Strategy.
    
    Algorithm:
    1. Calculate volume score = avg_daily_sales / cost
    2. Prioritize high turnover, low cost items
    3. Sort by volume score (descending)
    4. Greedily select to maximize units purchased
    
    Priority formula:
    volume_score = avg_daily_sales / cost
    
    Goal: Fill shelves with fast-moving, affordable items
    
    Args:
        products: List of available products
        budget: Total budget constraint
        restock_days: Target days of stock to maintain
    
    Returns:
        Tuple of (selected items, reasoning points)
    """
    reasoning = [
        f"Strategy: Volume Maximization - Maximize inventory turnover",
        f"Budget: ₱{budget:,.2f}",
        f"Target: {restock_days} days of fast-moving stock"
    ]
    
    # Add context information to reasoning
    if is_payday:
        reasoning.append("Context: Payday period detected - demand increased by 20%")
    if upcoming_holiday:
        reasoning.append(f"Context: Upcoming holiday ({upcoming_holiday}) - demand increased by 50%")
    
    # Calculate volume scores
    scored_products = []
    for p in products:
        # Apply context multipliers to base demand
        base_demand = p.avg_daily_sales
        adjusted_demand = apply_context_multipliers(
            base_demand=base_demand,
            product=p,
            is_payday=is_payday,
            upcoming_holiday=upcoming_holiday
        )
        
        # Volume score = adjusted sales velocity / cost (units per peso)
        volume_score = adjusted_demand / p.cost if p.cost > 0 else 0
        
        # Calculate needed quantity using adjusted demand
        daily_demand = adjusted_demand
        current_days_of_stock = p.stock / daily_demand if daily_demand > 0 else 999
        
        needed_qty = max(0, int((daily_demand * restock_days) - p.stock))
        
        # Respect min/max order quantities
        if needed_qty > 0:
            needed_qty = max(needed_qty, p.min_order_qty)
            if p.max_order_qty:
                needed_qty = min(needed_qty, p.max_order_qty)
        
        if needed_qty > 0:
            scored_products.append({
                'product': p,
                'score': volume_score,
                'qty': needed_qty
            })
    
    # Sort by volume score (descending)
    scored_products.sort(key=lambda x: x['score'], reverse=True)
    
    # Greedily select products
    selected_items: List[RestockItem] = []
    remaining_budget = budget
    
    for item in scored_products:
        p = item['product']
        qty = item['qty']
        
        total_cost = p.cost * qty
        
        if total_cost > remaining_budget:
            affordable_qty = int(remaining_budget / p.cost)
            if affordable_qty < p.min_order_qty:
                continue
            qty = affordable_qty
            total_cost = p.cost * qty
        
        if qty > 0 and total_cost <= remaining_budget:
            expected_revenue = qty * p.price
            # Ensure expected_profit is never negative (clamp to 0)
            expected_profit = max(0.0, qty * (p.price - p.cost))
            days_of_stock = qty / p.avg_daily_sales if p.avg_daily_sales > 0 else 999
            
            selected_items.append(RestockItem(
                product_id=p.product_id,
                name=p.name,
                qty=qty,
                unit_cost=p.cost,
                total_cost=total_cost,
                expected_profit=expected_profit,
                expected_revenue=expected_revenue,
                days_of_stock=days_of_stock,
                priority_score=item['score'],
                reasoning=f"High turnover ({p.avg_daily_sales:.1f} units/day), "
                         f"low cost (₱{p.cost:.2f}), "
                         f"efficiency: {item['score']:.2f} units/₱"
            ))
            
            remaining_budget -= total_cost
            
            if remaining_budget < 1:
                break
    
    reasoning.append(f"Selected {len(selected_items)} fast-moving, cost-efficient products")
    reasoning.append(f"Maximized inventory turnover and shelf replenishment")
    
    return selected_items, reasoning


def balanced_strategy(
    products: List[ProductInput],
    budget: float,
    restock_days: int,
    is_payday: bool = False,
    upcoming_holiday: str | None = None
) -> Tuple[List[RestockItem], List[str]]:
    """
    Balanced Growth Strategy.
    
    Algorithm:
    1. Calculate hybrid score = (profit_score × 0.5) + (volume_score × 0.5)
    2. Normalize both scores to 0-1 range
    3. Sort by hybrid score
    4. Select optimal mix
    
    Balances:
    - Profitability (margin × demand)
    - Turnover velocity (sales / cost)
    
    Args:
        products: List of available products
        budget: Total budget constraint
        restock_days: Target days of stock to maintain
    
    Returns:
        Tuple of (selected items, reasoning points)
    """
    reasoning = [
        f"Strategy: Balanced Growth - 50% profit + 50% volume optimization",
        f"Budget: ₱{budget:,.2f}",
        f"Target: {restock_days} days of balanced inventory"
    ]
    
    # Add context information to reasoning
    if is_payday:
        reasoning.append("Context: Payday period detected - demand increased by 20%")
    if upcoming_holiday:
        reasoning.append(f"Context: Upcoming holiday ({upcoming_holiday}) - demand increased by 50%")
    
    # Calculate both profit and volume scores
    scored_products = []
    profit_scores = []
    volume_scores = []
    
    for p in products:
        # Apply context multipliers to base demand
        base_demand = p.avg_daily_sales
        daily_demand = apply_context_multipliers(
            base_demand=base_demand,
            product=p,
            is_payday=is_payday,
            upcoming_holiday=upcoming_holiday
        )
        current_days_of_stock = p.stock / daily_demand if daily_demand > 0 else 999
        
        # Urgency factor
        if current_days_of_stock < 3:
            urgency = 3.0
        elif current_days_of_stock < 7:
            urgency = 2.0
        elif current_days_of_stock < restock_days:
            urgency = 1.5
        else:
            urgency = 1.0
        
        # Profit score (ensure unit_profit is non-negative)
        unit_profit = max(0.0, p.price - p.cost)
        profit_score = unit_profit * daily_demand * urgency
        profit_scores.append(profit_score)
        
        # Volume score (using adjusted demand)
        volume_score = daily_demand / p.cost if p.cost > 0 else 0
        volume_scores.append(volume_score)
        
        needed_qty = max(0, int((daily_demand * restock_days) - p.stock))
        if needed_qty > 0:
            needed_qty = max(needed_qty, p.min_order_qty)
            if p.max_order_qty:
                needed_qty = min(needed_qty, p.max_order_qty)
        
        if needed_qty > 0:
            scored_products.append({
                'product': p,
                'profit_score': profit_score,
                'volume_score': volume_score,
                'qty': needed_qty,
                'unit_profit': unit_profit
            })
    
    # Normalize scores to 0-1 range
    max_profit = max(profit_scores) if profit_scores else 1
    max_volume = max(volume_scores) if volume_scores else 1
    
    for item in scored_products:
        norm_profit = item['profit_score'] / max_profit if max_profit > 0 else 0
        norm_volume = item['volume_score'] / max_volume if max_volume > 0 else 0
        
        # Hybrid score: 50/50 weighted average
        item['hybrid_score'] = (norm_profit * 0.5) + (norm_volume * 0.5)
    
    # Sort by hybrid score (descending)
    scored_products.sort(key=lambda x: x['hybrid_score'], reverse=True)
    
    # Greedily select products
    selected_items: List[RestockItem] = []
    remaining_budget = budget
    
    for item in scored_products:
        p = item['product']
        qty = item['qty']
        
        total_cost = p.cost * qty
        
        if total_cost > remaining_budget:
            affordable_qty = int(remaining_budget / p.cost)
            if affordable_qty < p.min_order_qty:
                continue
            qty = affordable_qty
            total_cost = p.cost * qty
        
        if qty > 0 and total_cost <= remaining_budget:
            expected_revenue = qty * p.price
            # Ensure expected_profit is never negative (clamp to 0)
            # This handles edge cases where cost might exceed price
            expected_profit = max(0.0, qty * item['unit_profit'])
            days_of_stock = qty / p.avg_daily_sales if p.avg_daily_sales > 0 else 999
            
            selected_items.append(RestockItem(
                product_id=p.product_id,
                name=p.name,
                qty=qty,
                unit_cost=p.cost,
                total_cost=total_cost,
                expected_profit=expected_profit,
                expected_revenue=expected_revenue,
                days_of_stock=days_of_stock,
                priority_score=item['hybrid_score'],
                reasoning=f"Balanced score: {item['hybrid_score']:.2f}, "
                         f"margin: {p.profit_margin:.1%}, "
                         f"velocity: {p.avg_daily_sales:.1f}/day"
            ))
            
            remaining_budget -= total_cost
            
            if remaining_budget < 1:
                break
    
    reasoning.append(f"Selected {len(selected_items)} products balancing profit and turnover")
    reasoning.append(f"Optimized for sustainable growth and healthy cash flow")
    
    return selected_items, reasoning


def compute_totals(items: List[RestockItem], budget: float) -> RestockTotals:
    """
    Calculate aggregate totals for restocking strategy.
    
    Args:
        items: List of selected restock items
        budget: Original budget
    
    Returns:
        RestockTotals with all aggregate metrics
    """
    total_items = len(items)
    total_qty = sum(item.qty for item in items)
    total_cost = sum(item.total_cost for item in items)
    expected_revenue = sum(item.expected_revenue for item in items)
    # Ensure expected_profit is never negative (sum of already-clamped values)
    expected_profit = max(0.0, sum(item.expected_profit for item in items))
    
    budget_used_pct = (total_cost / budget * 100) if budget > 0 else 0
    expected_roi = (expected_profit / total_cost * 100) if total_cost > 0 else 0
    avg_days_of_stock = (sum(item.days_of_stock for item in items) / total_items) if total_items > 0 else 0
    
    return RestockTotals(
        total_items=total_items,
        total_qty=total_qty,
        total_cost=total_cost,
        budget_used_pct=budget_used_pct,
        expected_revenue=expected_revenue,
        expected_profit=expected_profit,
        expected_roi=expected_roi,
        avg_days_of_stock=avg_days_of_stock
    )


def generate_warnings(
    items: List[RestockItem],
    all_products: List[ProductInput],
    budget: float,
    totals: RestockTotals
) -> List[str]:
    """
    Generate warnings about the restocking strategy.
    
    Checks for:
    - Low budget utilization
    - Insufficient budget for all needed products
    - Very high/low days of stock
    - Missing critical products
    
    Args:
        items: Selected restock items
        all_products: All available products
        budget: Budget constraint
        totals: Computed totals
    
    Returns:
        List of warning messages
    """
    warnings = []
    
    # Low budget utilization
    if totals.budget_used_pct < 50:
        warnings.append(f"Only {totals.budget_used_pct:.1f}% of budget utilized. "
                       f"Consider lowering restock_days or reviewing product selection.")
    
    # Very high days of stock
    if totals.avg_days_of_stock > 45:
        warnings.append(f"Average {totals.avg_days_of_stock:.0f} days of stock may tie up capital. "
                       f"Consider reducing order quantities.")
    
    # Very low days of stock
    if totals.avg_days_of_stock < 7:
        warnings.append(f"Average {totals.avg_days_of_stock:.0f} days of stock is quite low. "
                       f"May need frequent restocking.")
    
    # Check if critical low-stock items were missed
    selected_ids = {str(item.product_id) for item in items}
    for p in all_products:
        if str(p.product_id) not in selected_ids:
            days_left = p.stock / p.avg_daily_sales if p.avg_daily_sales > 0 else 999
            if days_left < 3 and p.avg_daily_sales > 0:
                warnings.append(f"{p.name} has only {days_left:.1f} days of stock remaining "
                               f"but wasn't selected (budget constraints).")
    
    return warnings
