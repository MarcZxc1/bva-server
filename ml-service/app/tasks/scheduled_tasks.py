# File: app/tasks/scheduled_tasks.py
"""
Purpose: Scheduled background tasks for model maintenance and bulk operations.

Tasks:
- retrain_models: Nightly model retraining for popular products
- daily_forecast_batch: Generate forecasts for all products
- cleanup_old_models: Remove old model versions
"""

import structlog
from app.tasks.celery_app import celery_app
from app.models.persistence import list_models, delete_old_models
from app.config import settings

logger = structlog.get_logger()


@celery_app.task(name='app.tasks.scheduled_tasks.retrain_models')
def retrain_models():
    """
    Retrain forecast models for popular products.
    
    Strategy:
    - Identify products with recent sales activity
    - Retrain models if older than MODEL_CACHE_DAYS
    - Run during low-traffic hours
    
    Returns:
        Dict with summary statistics
    """
    logger.info("retrain_task_started")
    
    try:
        # In production, would query backend API for active products
        # For now, retrain all existing models
        
        models = list_models()
        retrained_count = 0
        failed_count = 0
        
        for model_info in models:
            shop_id = model_info['shop_id']
            product_id = model_info['product_id']
            
            try:
                # Would fetch fresh sales data and retrain here
                # Simplified for example
                logger.info("retraining_model", shop_id=shop_id, product_id=product_id)
                retrained_count += 1
            
            except Exception as e:
                logger.error("retrain_failed", product_id=product_id, error=str(e))
                failed_count += 1
        
        result = {
            "retrained": retrained_count,
            "failed": failed_count,
            "total": len(models)
        }
        
        logger.info("retrain_task_complete", **result)
        
        return result
    
    except Exception as e:
        logger.error("retrain_task_error", error=str(e))
        raise


@celery_app.task(name='app.tasks.scheduled_tasks.daily_forecast_batch')
def daily_forecast_batch():
    """
    Generate forecasts for all active products and push to backend.
    
    Returns:
        Dict with summary statistics
    """
    logger.info("forecast_batch_task_started")
    
    try:
        # In production:
        # 1. Fetch active products from backend API
        # 2. Generate forecasts for each
        # 3. POST results back to backend via callback URL
        
        models = list_models()
        forecast_count = 0
        
        for model_info in models:
            shop_id = model_info['shop_id']
            product_id = model_info['product_id']
            
            try:
                # Generate forecast (simplified)
                logger.info("generating_forecast", product_id=product_id)
                forecast_count += 1
            
            except Exception as e:
                logger.error("forecast_failed", product_id=product_id, error=str(e))
        
        result = {
            "forecasts_generated": forecast_count,
            "total": len(models)
        }
        
        logger.info("forecast_batch_complete", **result)
        
        return result
    
    except Exception as e:
        logger.error("forecast_batch_error", error=str(e))
        raise


@celery_app.task(name='app.tasks.scheduled_tasks.cleanup_old_models')
def cleanup_old_models():
    """
    Delete old model versions to free disk space.
    
    Keeps latest 2 versions per product.
    
    Returns:
        Dict with cleanup statistics
    """
    logger.info("cleanup_task_started")
    
    try:
        models = list_models()
        
        # Group by shop_id and product_id
        product_groups = {}
        for model in models:
            key = (model['shop_id'], model['product_id'])
            if key not in product_groups:
                product_groups[key] = []
            product_groups[key].append(model)
        
        deleted_total = 0
        
        for (shop_id, product_id), versions in product_groups.items():
            if len(versions) > 2:
                deleted = delete_old_models(shop_id, product_id, keep_latest=2)
                deleted_total += deleted
        
        result = {
            "models_deleted": deleted_total,
            "products_processed": len(product_groups)
        }
        
        logger.info("cleanup_complete", **result)
        
        return result
    
    except Exception as e:
        logger.error("cleanup_error", error=str(e))
        raise
