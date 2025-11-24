# Models Directory

This directory stores trained ML models with joblib serialization.

## File Naming Convention

```
{shop_id}_{product_id}_{version}.joblib
{shop_id}_{product_id}_{version}.meta.json
```

Example:

```
shop_123_product_456_20251115_143052.joblib
shop_123_product_456_20251115_143052.meta.json
```

## Metadata Structure

```json
{
  "shop_id": "shop_123",
  "product_id": "product_456",
  "version": "20251115_143052",
  "trained_at": "2025-11-15T14:30:52Z",
  "model_type": "linear",
  "train_samples": 45,
  "train_start_date": "2025-10-01T00:00:00Z",
  "train_end_date": "2025-11-14T00:00:00Z",
  "metrics": {
    "rmse": 1.23,
    "mae": 0.98
  },
  "feature_names": ["trend", "day_of_week"]
}
```

## Automatic Cleanup

Old model versions are automatically cleaned up by the scheduled task `cleanup_old_models`:

- Runs: Weekly on Sunday at 4 AM
- Keeps: Latest 2 versions per product
- Deletes: Older versions

## Manual Cleanup

To manually delete old models:

```python
from app.models.persistence import delete_old_models

# Delete old versions, keep latest 2
deleted = delete_old_models(
    shop_id="shop_123",
    product_id="product_456",
    keep_latest=2
)
```

## Volume Mount (Docker)

In production, mount this directory as a volume:

```yaml
volumes:
  - ./models:/app/models
```

This ensures models persist across container restarts.
