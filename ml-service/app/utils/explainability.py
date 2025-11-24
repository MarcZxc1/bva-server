# File: app/utils/explainability.py
"""
Purpose: Lightweight feature importance and model explainability utilities.
Provides simple interpretability for forecasting and recommendation models.

Key functions:
- extract_feature_importance: Get importance scores from trained models
- generate_textual_explanation: Convert importance scores to human-readable insights
- compute_contribution_scores: Attribute predictions to input features

Design philosophy:
- Keep it simple: no heavy SHAP dependencies for production
- Use built-in model properties (coef_, feature_importances_)
- Provide actionable text explanations for business users

Performance: All operations are O(n_features), typically < 100 features
"""

from typing import Dict, List, Any, Optional
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import GradientBoostingRegressor
import structlog

logger = structlog.get_logger()


def extract_feature_importance(
    model: Any,
    feature_names: List[str]
) -> Dict[str, float]:
    """
    Extract feature importance scores from trained model.
    
    Supports:
    - Linear models: absolute coefficient values
    - Tree-based models: built-in feature_importances_
    - Other models: returns empty dict
    
    Args:
        model: Trained scikit-learn model
        feature_names: List of feature names matching model input
    
    Returns:
        Dict mapping feature_name -> importance score (0-1, normalized)
    
    Performance: O(n_features)
    """
    importance_dict = {}
    
    try:
        # Linear models (LinearRegression, Ridge, Lasso, etc.)
        if hasattr(model, 'coef_'):
            coefs = np.abs(model.coef_)
            # Normalize to sum to 1
            total = coefs.sum()
            if total > 0:
                normalized = coefs / total
                importance_dict = {
                    name: float(score)
                    for name, score in zip(feature_names, normalized)
                }
        
        # Tree-based models (RandomForest, GradientBoosting, XGBoost)
        elif hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            importance_dict = {
                name: float(score)
                for name, score in zip(feature_names, importances)
            }
        
        else:
            logger.debug("model_no_feature_importance", model_type=type(model).__name__)
    
    except Exception as e:
        logger.warning("feature_importance_extraction_failed", error=str(e))
    
    return importance_dict


def generate_textual_explanation(
    feature_importance: Dict[str, float],
    top_k: int = 3
) -> str:
    """
    Convert feature importance to human-readable explanation.
    
    Args:
        feature_importance: Dict of feature -> importance score
        top_k: Number of top features to mention
    
    Returns:
        Plain English explanation string
    
    Example output:
        "Sales forecast primarily driven by: recent_trend (45%), day_of_week (30%), seasonality (15%)"
    
    Performance: O(n log n) for sorting features
    """
    if not feature_importance:
        return "Model explanation not available."
    
    # Sort by importance (descending)
    sorted_features = sorted(
        feature_importance.items(),
        key=lambda x: x[1],
        reverse=True
    )[:top_k]
    
    # Format as text
    feature_texts = [
        f"{name.replace('_', ' ')} ({score*100:.0f}%)"
        for name, score in sorted_features
    ]
    
    explanation = "Sales forecast primarily driven by: " + ", ".join(feature_texts)
    
    return explanation


def compute_trend_features(sales_series: np.ndarray) -> Dict[str, float]:
    """
    Extract trend-based features from sales time series.
    
    Features:
    - recent_trend: slope of last 7 days
    - volatility: coefficient of variation
    - momentum: difference between recent and older averages
    
    Args:
        sales_series: Array of sales values (chronological order)
    
    Returns:
        Dict of feature_name -> value
    
    Performance: O(n) where n = length of series
    
    Used for:
    - Feature engineering before model training
    - Explaining which patterns drive forecasts
    """
    if len(sales_series) < 2:
        return {}
    
    features = {}
    
    try:
        # Recent trend (last 7 days linear slope)
        if len(sales_series) >= 7:
            recent = sales_series[-7:]
            x = np.arange(len(recent))
            slope, _ = np.polyfit(x, recent, 1)
            features['recent_trend'] = float(slope)
        
        # Volatility (coefficient of variation)
        mean_val = sales_series.mean()
        if mean_val > 0:
            cv = sales_series.std() / mean_val
            features['volatility'] = float(cv)
        
        # Momentum (recent avg vs older avg)
        if len(sales_series) >= 14:
            recent_avg = sales_series[-7:].mean()
            older_avg = sales_series[-14:-7].mean()
            if older_avg > 0:
                momentum = (recent_avg - older_avg) / older_avg
                features['momentum'] = float(momentum)
    
    except Exception as e:
        logger.warning("trend_feature_extraction_failed", error=str(e))
    
    return features


def explain_at_risk_score(
    low_stock: bool,
    near_expiry: bool,
    slow_moving: bool,
    quantity: int,
    days_to_expiry: Optional[int],
    avg_daily_sales: Optional[float]
) -> str:
    """
    Generate explanation for at-risk inventory score.
    
    Args:
        low_stock: Whether item flagged for low stock
        near_expiry: Whether item flagged for near expiry
        slow_moving: Whether item flagged as slow-moving
        quantity: Current quantity
        days_to_expiry: Days until expiration (or None)
        avg_daily_sales: Average daily sales rate (or None)
    
    Returns:
        Human-readable explanation string
    
    Example:
        "Critical risk: Only 5 units remaining with 3 days to expiry. Average daily sales of 0.8 
        means stock will not clear in time. Recommend aggressive promotion (30-40% discount)."
    """
    reasons = []
    
    if low_stock:
        reasons.append(f"only {quantity} units in stock")
    
    if near_expiry and days_to_expiry is not None:
        reasons.append(f"{days_to_expiry} days until expiry")
    
    if slow_moving and avg_daily_sales is not None:
        reasons.append(f"low sales velocity ({avg_daily_sales:.1f} units/day)")
    
    # Determine urgency
    if near_expiry and slow_moving:
        urgency = "Critical risk"
        action = "Recommend aggressive promotion (30-40% discount)"
    elif near_expiry or low_stock:
        urgency = "High risk"
        action = "Recommend moderate promotion (15-25% discount) or bundling"
    else:
        urgency = "Moderate risk"
        action = "Monitor closely and consider restocking"
    
    explanation = f"{urgency}: {', '.join(reasons)}. {action}."
    
    return explanation


def generate_promotion_reasoning(
    product_name: str,
    event_title: str,
    days_to_expiry: int,
    discount_pct: float,
    expected_clear_days: int
) -> str:
    """
    Generate reasoning for promotion recommendation.
    
    Args:
        product_name: Name of product
        event_title: Calendar event name
        days_to_expiry: Days until product expires
        discount_pct: Recommended discount percentage
        expected_clear_days: Estimated days to clear inventory
    
    Returns:
        Human-readable reasoning string
    
    Example:
        "Pair Fresh Milk with Weekend Sale: product expires in 5 days, 20% discount should 
        clear inventory in 3 days, leaving 2-day safety margin."
    """
    safety_margin = days_to_expiry - expected_clear_days
    
    reasoning = (
        f"Pair {product_name} with {event_title}: product expires in {days_to_expiry} days, "
        f"{discount_pct:.0f}% discount should clear inventory in {expected_clear_days} days"
    )
    
    if safety_margin > 0:
        reasoning += f", leaving {safety_margin}-day safety margin."
    else:
        reasoning += " (tight timing - monitor closely)."
    
    return reasoning
