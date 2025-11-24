# File: app/services/forecast_service.py
"""
Purpose: Demand forecasting service with caching and model management.
Orchestrates training, prediction, and caching for multiple products.

Key functions:
- forecast_demand: Main entry point for forecasting
- batch_forecast: Forecast multiple products efficiently
- get_or_train_model: Load cached model or train new one

Performance optimizations:
- Redis caching for recent forecasts (24h TTL)
- Model persistence to avoid retraining
- Batch processing for multi-product forecasts
- Async-ready design (can be made async with minimal changes)

Caching strategy:
- Level 1: Redis cache for identical requests (instant)
- Level 2: Disk-persisted models (fast load ~50ms)
- Level 3: Train new model (~100-500ms depending on method)
"""

from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
import pandas as pd
import structlog
from app.schemas.forecast_schema import (
    ForecastRequest,
    ProductForecast,
    Prediction,
    ForecastMethod
)
from app.models.trainer import ForecastTrainer, train_forecast_model
from app.models.persistence import save_model, load_model
from app.utils.pandas_utils import prepare_sales_dataframe
from app.utils.caching import cache_manager, get_cache_key
from app.utils.explainability import extract_feature_importance, generate_textual_explanation
from app.config import settings

logger = structlog.get_logger()


def forecast_demand(
    shop_id: str,
    product_id: str,
    sales_df: pd.DataFrame,
    periods: int,
    method: str = "auto",
    confidence_interval: float = 0.95
) -> ProductForecast:
    """
    Forecast demand for a single product.
    
    Args:
        shop_id: Shop identifier
        product_id: Product identifier
        sales_df: Historical sales DataFrame with columns [date, qty]
        periods: Number of periods to forecast
        method: Forecasting method
        confidence_interval: CI level
    
    Returns:
        ProductForecast object with predictions and metadata
    
    Performance:
    - Cache hit: ~1ms (Redis lookup)
    - Model load: ~50ms (disk read + joblib)
    - Training: ~100-500ms (depends on method and data size)
    
    Caching:
    - Caches final forecast in Redis (24h TTL)
    - Key includes shop_id, product_id, periods, method, data_hash
    """
    logger.info("forecasting_demand", shop_id=shop_id, product_id=product_id, periods=periods)
    
    # Check cache
    cache_key = get_cache_key(
        "forecast",
        shop_id=shop_id,
        product_id=product_id,
        periods=periods,
        method=method,
        data_hash=sales_df['qty'].sum()  # Simple hash
    )
    
    cached_forecast = cache_manager.get(cache_key)
    if cached_forecast is not None:
        logger.info("forecast_cache_hit", product_id=product_id)
        return cached_forecast
    
    # Get or train model
    trainer, metadata = get_or_train_model(
        shop_id=shop_id,
        product_id=product_id,
        sales_df=sales_df,
        method=method,
        confidence_interval=confidence_interval
    )
    
    # Generate predictions
    last_date = sales_df['date'].max()
    predictions_df = trainer.predict(
        periods=periods,
        last_date=last_date,
        historical_data=sales_df
    )
    
    # Convert to Prediction objects
    predictions = [
        Prediction(
            date=row['date'].isoformat(),
            predicted_qty=float(row['predicted_qty']),
            lower_ci=float(row['lower_ci']) if 'lower_ci' in row else None,
            upper_ci=float(row['upper_ci']) if 'upper_ci' in row else None
        )
        for _, row in predictions_df.iterrows()
    ]
    
    # Extract feature importance if available
    feature_importance = None
    if trainer.feature_names:
        importance_dict = extract_feature_importance(trainer.model, trainer.feature_names)
        if importance_dict:
            feature_importance = importance_dict
    
    # Build response
    forecast = ProductForecast(
        product_id=product_id,
        predictions=predictions,
        method=metadata.get('method', method),
        model_version=metadata.get('version', 'unknown'),
        trained_at=metadata.get('trained_at'),
        feature_importance=feature_importance,
        rmse=metadata.get('metrics', {}).get('rmse')
    )
    
    # Cache result
    cache_manager.set(cache_key, forecast, ttl=settings.REDIS_CACHE_TTL)
    
    logger.info("forecast_complete", product_id=product_id, method=forecast.method)
    
    return forecast


def batch_forecast(
    shop_id: str,
    product_ids: List[str],
    sales_df: pd.DataFrame,
    periods: int,
    method: str = "auto"
) -> List[ProductForecast]:
    """
    Forecast demand for multiple products in batch.
    
    Args:
        shop_id: Shop identifier
        product_ids: List of product identifiers
        sales_df: Sales DataFrame with column 'product_id'
        periods: Forecast periods
        method: Forecasting method
    
    Returns:
        List of ProductForecast objects
    
    Performance: O(n * forecast_time) where n = number of products
    Could be parallelized with concurrent.futures for further speedup.
    """
    forecasts = []
    
    for product_id in product_ids:
        try:
            product_sales = sales_df[sales_df['product_id'] == product_id].copy()
            
            if len(product_sales) < 2:
                logger.warning("insufficient_data_for_forecast", product_id=product_id)
                continue
            
            forecast = forecast_demand(
                shop_id=shop_id,
                product_id=product_id,
                sales_df=product_sales,
                periods=periods,
                method=method
            )
            
            forecasts.append(forecast)
        
        except Exception as e:
            logger.error("forecast_failed", product_id=product_id, error=str(e))
            # Continue with other products
    
    return forecasts


def get_or_train_model(
    shop_id: str,
    product_id: str,
    sales_df: pd.DataFrame,
    method: str = "auto",
    confidence_interval: float = 0.95
) -> Tuple[ForecastTrainer, Dict[str, Any]]:
    """
    Load existing model or train new one.
    
    Args:
        shop_id: Shop identifier
        product_id: Product identifier
        sales_df: Historical sales data
        method: Forecasting method
        confidence_interval: CI level
    
    Returns:
        Tuple of (trained_model, metadata)
    
    Logic:
    1. Try to load from disk
    2. Check if model is stale (> MODEL_CACHE_DAYS old)
    3. If stale or missing, train new model and save
    
    Performance:
    - Load: ~50ms
    - Train + save: ~150-600ms
    """
    # Try to load existing model
    loaded = load_model(shop_id, product_id, max_age_days=settings.MODEL_CACHE_DAYS)
    
    if loaded is not None:
        model_obj, metadata = loaded
        
        # Recreate trainer with loaded model
        trainer = ForecastTrainer(method=metadata.get('method', method))
        trainer.model = model_obj
        trainer.metrics = metadata.get('metrics', {})
        trainer.feature_names = metadata.get('feature_names', [])
        
        logger.info("model_loaded_from_disk", product_id=product_id, version=metadata.get('version'))
        
        return trainer, metadata
    
    # Train new model
    logger.info("training_new_model", product_id=product_id, method=method)
    
    trainer, train_metrics = train_forecast_model(
        sales_df=sales_df,
        method=method,
        confidence_interval=confidence_interval
    )
    
    # Prepare metadata
    metadata = {
        'trained_at': datetime.utcnow().isoformat(),
        'model_type': train_metrics.get('method', method),
        'train_samples': len(sales_df),
        'train_start_date': sales_df['date'].min().isoformat(),
        'train_end_date': sales_df['date'].max().isoformat(),
        'metrics': train_metrics.get('metrics', {}),
        'feature_names': trainer.feature_names,
        'method': train_metrics.get('method')
    }
    
    # Save model for future use
    try:
        save_model(
            model=trainer.model,
            shop_id=shop_id,
            product_id=product_id,
            metadata=metadata
        )
    except Exception as e:
        logger.warning("model_save_failed", product_id=product_id, error=str(e))
        # Continue anyway - model still usable in memory
    
    return trainer, metadata
