# File: app/models/persistence.py
"""
Purpose: Model serialization and persistence using joblib.
Handles saving/loading trained models with metadata and versioning.

Key functions:
- save_model: Persist model and metadata to disk
- load_model: Load model from disk with staleness check
- get_model_path: Generate consistent file paths for models
- list_models: Enumerate available saved models

Design decisions:
- Use joblib for efficient numpy/pandas serialization (better than pickle)
- Store metadata separately (JSON) for inspection without loading model
- Include version timestamp in filename for model lineage
- Support model cleanup (delete old versions)

Performance:
- Save: O(model_size) - typically 10-100ms for small models
- Load: O(model_size) - typically 5-50ms
- Metadata read: O(1) - instant JSON load

File structure:
    models/
        shop_123_product_456_20231115_143052.joblib
        shop_123_product_456_20231115_143052.meta.json
"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import joblib
import structlog
from app.config import settings

logger = structlog.get_logger()


def get_model_path(
    shop_id: str,
    product_id: str,
    version: Optional[str] = None
) -> Tuple[Path, Path]:
    """
    Generate file paths for model and metadata.
    
    Args:
        shop_id: Shop identifier
        product_id: Product identifier
        version: Optional version string (default: current timestamp)
    
    Returns:
        Tuple of (model_path, metadata_path)
    
    Format: {shop_id}_{product_id}_{version}.joblib
    """
    if version is None:
        version = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    
    model_dir = Path(settings.MODEL_DIR)
    model_dir.mkdir(parents=True, exist_ok=True)
    
    base_name = f"{shop_id}_{product_id}_{version}"
    model_path = model_dir / f"{base_name}.joblib"
    meta_path = model_dir / f"{base_name}.meta.json"
    
    return model_path, meta_path


def save_model(
    model: Any,
    shop_id: str,
    product_id: str,
    metadata: Dict[str, Any],
    version: Optional[str] = None
) -> Tuple[str, str]:
    """
    Save trained model and metadata to disk.
    
    Args:
        model: Trained model object (scikit-learn, xgboost, etc.)
        shop_id: Shop identifier
        product_id: Product identifier
        metadata: Dict containing training info (see below)
        version: Optional version string (default: timestamp)
    
    Metadata should include:
        - trained_at: ISO timestamp
        - model_type: "linear", "xgboost", etc.
        - train_samples: Number of training samples
        - train_start_date, train_end_date: Data range
        - metrics: Dict of validation metrics (rmse, mae, etc.)
        - feature_names: List of input feature names
    
    Returns:
        Tuple of (model_path, metadata_path)
    
    Performance: ~10-100ms depending on model size
    
    Error handling:
    - Creates directory if not exists
    - Logs errors but doesn't raise (graceful degradation)
    """
    try:
        model_path, meta_path = get_model_path(shop_id, product_id, version)
        
        # Add timestamp if not present
        if 'trained_at' not in metadata:
            metadata['trained_at'] = datetime.utcnow().isoformat()
        
        # Add version to metadata
        metadata['version'] = version or datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        metadata['shop_id'] = shop_id
        metadata['product_id'] = product_id
        
        # Save model
        joblib.dump(model, model_path)
        
        # Save metadata
        with open(meta_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(
            "model_saved",
            shop_id=shop_id,
            product_id=product_id,
            model_path=str(model_path),
            size_bytes=model_path.stat().st_size
        )
        
        return str(model_path), str(meta_path)
    
    except Exception as e:
        logger.error("model_save_failed", shop_id=shop_id, product_id=product_id, error=str(e))
        raise


def load_model(
    shop_id: str,
    product_id: str,
    max_age_days: Optional[int] = None
) -> Optional[Tuple[Any, Dict[str, Any]]]:
    """
    Load most recent model for given shop/product.
    
    Args:
        shop_id: Shop identifier
        product_id: Product identifier
        max_age_days: Maximum model age in days (default: settings.MODEL_CACHE_DAYS)
    
    Returns:
        Tuple of (model, metadata) if found and fresh, else None
    
    Behavior:
    - Finds latest model by version timestamp
    - Checks if model is within max_age_days
    - Returns None if stale or not found
    
    Performance: O(n) where n = number of model files (uses glob)
    Typically < 10ms with caching
    """
    try:
        model_dir = Path(settings.MODEL_DIR)
        if not model_dir.exists():
            return None
        
        # Find all models for this shop/product
        pattern = f"{shop_id}_{product_id}_*.joblib"
        model_files = list(model_dir.glob(pattern))
        
        if not model_files:
            logger.debug("no_model_found", shop_id=shop_id, product_id=product_id)
            return None
        
        # Sort by version (timestamp) descending
        model_files.sort(reverse=True)
        latest_model_path = model_files[0]
        
        # Load metadata
        meta_path = latest_model_path.with_suffix('.meta.json')
        if not meta_path.exists():
            logger.warning("metadata_missing", model_path=str(latest_model_path))
            return None
        
        with open(meta_path, 'r') as f:
            metadata = json.load(f)
        
        # Check staleness
        max_age = max_age_days or settings.MODEL_CACHE_DAYS
        trained_at = datetime.fromisoformat(metadata['trained_at'])
        age_days = (datetime.utcnow() - trained_at).days
        
        if age_days > max_age:
            logger.info(
                "model_stale",
                shop_id=shop_id,
                product_id=product_id,
                age_days=age_days,
                max_age=max_age
            )
            return None
        
        # Load model
        model = joblib.load(latest_model_path)
        
        logger.info(
            "model_loaded",
            shop_id=shop_id,
            product_id=product_id,
            version=metadata.get('version'),
            age_days=age_days
        )
        
        return model, metadata
    
    except Exception as e:
        logger.error("model_load_failed", shop_id=shop_id, product_id=product_id, error=str(e))
        return None


def list_models(shop_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    List all available models with metadata.
    
    Args:
        shop_id: Optional filter by shop_id
    
    Returns:
        List of dicts with keys: shop_id, product_id, version, trained_at, metrics, path
    
    Performance: O(n) where n = number of model files
    Used for admin/debugging endpoints to inspect model inventory.
    """
    models = []
    
    try:
        model_dir = Path(settings.MODEL_DIR)
        if not model_dir.exists():
            return models
        
        # Find all metadata files
        pattern = f"{shop_id}_*.meta.json" if shop_id else "*.meta.json"
        meta_files = model_dir.glob(pattern)
        
        for meta_path in meta_files:
            try:
                with open(meta_path, 'r') as f:
                    metadata = json.load(f)
                
                model_path = meta_path.with_suffix('.joblib')
                
                models.append({
                    'shop_id': metadata.get('shop_id'),
                    'product_id': metadata.get('product_id'),
                    'version': metadata.get('version'),
                    'trained_at': metadata.get('trained_at'),
                    'model_type': metadata.get('model_type'),
                    'metrics': metadata.get('metrics', {}),
                    'path': str(model_path),
                    'size_bytes': model_path.stat().st_size if model_path.exists() else 0
                })
            except Exception as e:
                logger.warning("metadata_parse_failed", path=str(meta_path), error=str(e))
        
        # Sort by trained_at descending
        models.sort(key=lambda x: x.get('trained_at', ''), reverse=True)
    
    except Exception as e:
        logger.error("list_models_failed", error=str(e))
    
    return models


def delete_old_models(
    shop_id: str,
    product_id: str,
    keep_latest: int = 2
) -> int:
    """
    Delete old model versions, keeping only the N most recent.
    
    Args:
        shop_id: Shop identifier
        product_id: Product identifier
        keep_latest: Number of recent versions to keep
    
    Returns:
        Number of models deleted
    
    Used for:
    - Cleanup tasks to prevent disk bloat
    - Retention policy enforcement
    
    Performance: O(n log n) where n = number of versions
    """
    try:
        model_dir = Path(settings.MODEL_DIR)
        pattern = f"{shop_id}_{product_id}_*.joblib"
        model_files = sorted(list(model_dir.glob(pattern)), reverse=True)
        
        deleted = 0
        for model_path in model_files[keep_latest:]:
            meta_path = model_path.with_suffix('.meta.json')
            
            model_path.unlink()
            if meta_path.exists():
                meta_path.unlink()
            
            deleted += 1
        
        if deleted > 0:
            logger.info(
                "old_models_deleted",
                shop_id=shop_id,
                product_id=product_id,
                count=deleted
            )
        
        return deleted
    
    except Exception as e:
        logger.error("model_deletion_failed", error=str(e))
        return 0
