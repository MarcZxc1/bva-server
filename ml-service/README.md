# SmartShelf ML Service

A production-ready FastAPI microservice for intelligent inventory management, demand forecasting, and promotion planning.

## 🎯 Features

### 1. At-Risk Inventory Detection

- **Low Stock Alerts**: Identify products running low on inventory
- **Near-Expiry Detection**: Flag products approaching expiration dates
- **Slow-Moving Analysis**: Detect products with poor sales velocity
- **Risk Scoring**: Normalized 0-1 risk scores with prioritization
- **Actionable Recommendations**: Specific actions (restock, discount, bundle, clearance)

### 2. Demand Forecasting

- **Multiple Algorithms**: Auto-selection between Linear, Exponential Smoothing, XGBoost
- **Confidence Intervals**: Prediction intervals for risk management
- **Model Persistence**: Cached models to avoid retraining
- **Batch Processing**: Forecast multiple products efficiently
- **Feature Engineering**: Automated lag, rolling, and trend features

### 3. Promotion Planning

- **Event Pairing**: Match near-expiry products with calendar events
- **Discount Optimization**: Calculate optimal discounts respecting margin constraints
- **Marketing Copy**: Auto-generated promotion text
- **Clearance Estimation**: Predict days to sell-through at discount rate
- **Confidence Scoring**: Risk assessment for each promotion recommendation

### 4. Sales Analytics & Insights

- **Time-Series Aggregation**: Daily, weekly, monthly granularity
- **Moving Averages**: 7-day and 30-day trend smoothing
- **Top Products**: Top-K analysis with trend detection
- **Seasonality Detection**: Day-of-week and monthly patterns
- **Business Recommendations**: Actionable insights in plain text

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Node Backend  │
│   (TypeScript)  │
└────────┬────────┘
         │ HTTP/JSON
         ↓
┌─────────────────────────────────────────┐
│         FastAPI ML Service              │
│  ┌─────────────────────────────────┐   │
│  │  Routes (smart_shelf.py)        │   │
│  └──────────┬──────────────────────┘   │
│             ↓                           │
│  ┌─────────────────────────────────┐   │
│  │  Services Layer                 │   │
│  │  • inventory_service.py         │   │
│  │  • forecast_service.py          │   │
│  │  • insights_service.py          │   │
│  │  • promotion_service.py         │   │
│  └──────────┬──────────────────────┘   │
│             ↓                           │
│  ┌─────────────────────────────────┐   │
│  │  Models & Utils                 │   │
│  │  • trainer.py (ML training)     │   │
│  │  • persistence.py (save/load)   │   │
│  │  • pandas_utils.py (vectorized) │   │
│  │  • caching.py (Redis)           │   │
│  └─────────────────────────────────┘   │
└─────────────────┬───────────────────────┘
                  │
         ┌────────┴────────┐
         ↓                 ↓
   ┌──────────┐      ┌──────────┐
   │  Redis   │      │ Celery   │
   │  Cache   │      │ Workers  │
   └──────────┘      └──────────┘
```

---

## 📋 Prerequisites

- Python 3.10+
- Redis (for caching and Celery)
- Docker & Docker Compose (optional, recommended)

---

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```powershell
# Clone and navigate to ml-service
cd ml-service

# Copy environment template
Copy-Item .env.example .env

# Edit .env with your configuration
# notepad .env

# Build and start all services
docker-compose up --build

# API will be available at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### Option 2: Local Development

```powershell
# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Copy environment file
Copy-Item .env.example .env

# Start Redis (requires Redis installed or Docker)
docker run -d -p 6379:6379 redis:7-alpine

# Run FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# In separate terminals:

# Start Celery worker
celery -A app.tasks.celery_app worker --loglevel=info

# Start Celery beat (scheduler)
celery -A app.tasks.celery_app beat --loglevel=info
```

---

## 📚 API Documentation

### Interactive Docs

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Endpoints

#### 1. At-Risk Inventory Detection

```http
POST /api/v1/smart-shelf/at-risk
```

**Request:**

```json
{
  "shop_id": "shop_123",
  "inventory": [
    {
      "product_id": "p001",
      "sku": "SKU001",
      "name": "Fresh Milk",
      "quantity": 5,
      "expiry_date": "2025-11-20T00:00:00Z",
      "price": 3.99
    }
  ],
  "sales": [
    {
      "product_id": "p001",
      "date": "2025-11-10",
      "qty": 2.0,
      "revenue": 7.98
    }
  ],
  "thresholds": {
    "low_stock": 10,
    "expiry_days": 7,
    "slow_moving_window": 30,
    "slow_moving_threshold": 0.5
  }
}
```

**Response:**

```json
{
  "at_risk": [
    {
      "product_id": "p001",
      "sku": "SKU001",
      "name": "Fresh Milk",
      "reasons": ["low_stock", "near_expiry"],
      "score": 0.75,
      "current_quantity": 5,
      "days_to_expiry": 5,
      "avg_daily_sales": 0.8,
      "recommended_action": {
        "action_type": "clearance",
        "discount_range": [30.0, 40.0],
        "promotion_timing": "within 5 days",
        "reasoning": "Critical risk: only 5 units in stock, 5 days until expiry..."
      }
    }
  ],
  "meta": {
    "shop_id": "shop_123",
    "total_products": 1,
    "flagged_count": 1
  }
}
```

#### 2. Demand Forecasting

```http
POST /api/v1/smart-shelf/forecast
```

**Request:**

```json
{
  "shop_id": "shop_123",
  "product_id": "p001",
  "sales": [
    { "product_id": "p001", "date": "2025-11-01", "qty": 10 },
    { "product_id": "p001", "date": "2025-11-02", "qty": 12 }
  ],
  "periods": 14,
  "model": "auto",
  "confidence_interval": 0.95
}
```

**Response:**

```json
{
  "forecasts": [
    {
      "product_id": "p001",
      "predictions": [
        {
          "date": "2025-11-16",
          "predicted_qty": 15.3,
          "lower_ci": 12.1,
          "upper_ci": 18.5
        }
      ],
      "method": "linear",
      "model_version": "20251115_143052",
      "trained_at": "2025-11-15T14:30:52Z",
      "rmse": 1.2
    }
  ],
  "meta": {
    "shop_id": "shop_123",
    "total_products": 1
  }
}
```

#### 3. Promotion Planning

```http
POST /api/v1/smart-shelf/promotions
```

**Request:**

```json
{
  "shop_id": "shop_123",
  "items": [
    {
      "product_id": "p001",
      "name": "Fresh Berries",
      "expiry_date": "2025-11-20",
      "quantity": 30,
      "price": 5.99,
      "categories": ["produce", "fresh"]
    }
  ],
  "calendar_events": [
    {
      "id": "evt_001",
      "date": "2025-11-18",
      "title": "Weekend Sale",
      "audience": "families"
    }
  ],
  "preferences": {
    "discount_max_pct": 40.0,
    "min_margin_pct": 10.0
  }
}
```

**Response:**

```json
{
  "promotions": [
    {
      "event_id": "evt_001",
      "event_title": "Weekend Sale",
      "product_id": "p001",
      "product_name": "Fresh Berries",
      "suggested_discount_pct": 25.0,
      "promo_copy": "Weekend Sale Special: 25% off Fresh Berries! Limited time offer.",
      "start_date": "2025-11-16",
      "end_date": "2025-11-19",
      "expected_clear_days": 3,
      "projected_sales_lift": 50.0,
      "confidence": "high",
      "reasoning": "Pair Fresh Berries with Weekend Sale: product expires in 5 days..."
    }
  ],
  "meta": {
    "shop_id": "shop_123",
    "promotions_generated": 1
  }
}
```

#### 4. Sales Insights

```http
POST /api/v1/smart-shelf/insights
```

**Request:**

```json
{
  "shop_id": "shop_123",
  "sales": [
    { "product_id": "p001", "date": "2025-11-01", "qty": 10, "revenue": 50.0 }
  ],
  "range": {
    "start": "2025-11-01",
    "end": "2025-11-15"
  },
  "granularity": "daily",
  "top_k": 10
}
```

**Response:**

```json
{
  "series": [
    {
      "date": "2025-11-01",
      "total_sales": 45.0,
      "total_revenue": 223.5,
      "moving_avg_7": 42.1,
      "moving_avg_30": 38.5
    }
  ],
  "top_items": [
    {
      "product_id": "p001",
      "total_qty": 150.0,
      "total_revenue": 749.5,
      "trend": "increasing",
      "trend_slope": 0.5
    }
  ],
  "seasonality": {
    "peak_day": "Saturday",
    "peak_month": "November"
  },
  "recommendations": [
    "High demand detected for product p001. Consider increasing stock levels."
  ]
}
```

---

## 🧪 Testing

```powershell
# Run all tests
pytest app/tests/ -v

# Run with coverage
pytest app/tests/ --cov=app --cov-report=html

# Run specific test file
pytest app/tests/test_forecast.py -v

# Run specific test
pytest app/tests/test_inventory.py::test_low_stock_detection -v
```

---

## 🔧 Configuration

All configuration via environment variables (see `.env.example`):

| Variable                          | Description                  | Default                    |
| --------------------------------- | ---------------------------- | -------------------------- |
| `REDIS_URL`                       | Redis connection URL         | `redis://localhost:6379/0` |
| `MODEL_DIR`                       | Directory for model storage  | `./models`                 |
| `MODEL_CACHE_DAYS`                | Model staleness threshold    | `7`                        |
| `MAX_PAYLOAD_ROWS`                | Max records per request      | `100000`                   |
| `DEFAULT_MAX_DISCOUNT_PCT`        | Max discount %               | `40.0`                     |
| `PROMOTION_ELASTICITY_MULTIPLIER` | Demand uplift per % discount | `2.0`                      |

---

## 📊 Performance Characteristics

| Operation             | Complexity    | Typical Time | Notes             |
| --------------------- | ------------- | ------------ | ----------------- |
| At-risk detection     | O(n log n)    | 50-100ms     | 1000 products     |
| Forecast (cached)     | O(1)          | 1-5ms        | Redis hit         |
| Forecast (model load) | O(model_size) | 50ms         | Joblib load       |
| Forecast (train)      | O(n log n)    | 100-500ms    | Depends on method |
| Insights generation   | O(n log n)    | 100-300ms    | 10K sales records |
| Promotion planning    | O(n \* m)     | 10-50ms      | n=items, m=events |

---

## 🐳 Docker Commands

```powershell
# Build image
docker build -t smartshelf-ml:latest .

# Run standalone (with external Redis)
docker run -d \
  -p 8000:8000 \
  -e REDIS_URL=redis://host.docker.internal:6379/0 \
  -v ${PWD}/models:/app/models \
  smartshelf-ml:latest

# View logs
docker-compose logs -f api

# Restart service
docker-compose restart api

# Stop all services
docker-compose down

# Clean up volumes
docker-compose down -v
```

---

## 🔄 Background Tasks

Celery handles scheduled maintenance tasks:

| Task                   | Schedule        | Purpose                                |
| ---------------------- | --------------- | -------------------------------------- |
| `retrain_models`       | Daily 2 AM      | Retrain models for active products     |
| `daily_forecast_batch` | Daily 3 AM      | Generate forecasts and push to backend |
| `cleanup_old_models`   | Weekly Sun 4 AM | Delete old model versions              |

---

## 📖 Code Documentation

### File Structure Explained

```
app/
├── main.py                 # FastAPI app + middleware + health endpoints
├── config.py               # Settings management (pydantic-settings)
├── schemas/                # Pydantic request/response models
│   ├── inventory_schema.py   # At-risk detection schemas
│   └── forecast_schema.py    # Forecasting & insights schemas
├── routes/                 # FastAPI route handlers
│   └── smart_shelf.py        # All SmartShelf endpoints
├── services/               # Business logic layer
│   ├── inventory_service.py  # Risk scoring & detection
│   ├── forecast_service.py   # Demand forecasting orchestration
│   ├── insights_service.py   # Analytics & recommendations
│   └── promotion_service.py  # Promotion planning logic
├── models/                 # ML model management
│   ├── trainer.py            # Model training (Linear, XGBoost, etc.)
│   └── persistence.py        # Model save/load with joblib
├── utils/                  # Shared utilities
│   ├── pandas_utils.py       # Vectorized data operations
│   ├── caching.py            # Redis cache manager
│   └── explainability.py     # Feature importance & explanations
├── tasks/                  # Celery background tasks
│   ├── celery_app.py         # Celery configuration
│   └── scheduled_tasks.py    # Scheduled job definitions
└── tests/                  # Unit tests
    ├── test_inventory.py     # Inventory service tests
    └── test_forecast.py      # Forecasting tests
```

### Key Design Patterns

1. **Layered Architecture**: Routes → Services → Models/Utils
2. **Dependency Injection**: Settings via environment variables
3. **Caching Strategy**: Multi-level (Redis + disk persistence)
4. **Vectorization**: All pandas operations avoid Python loops
5. **Graceful Degradation**: Cache failures don't break functionality

---

## 🚨 Troubleshooting

### Redis Connection Errors

```powershell
# Check Redis is running
docker ps | grep redis

# Test Redis connection
redis-cli ping

# Check logs
docker-compose logs redis
```

### Model Not Found Errors

```powershell
# Ensure models directory exists
mkdir models

# Check permissions
icacls models

# Volume mount in Docker Compose:
# Verify ./models:/app/models mapping
```

### High Memory Usage

- Reduce `WORKERS` in .env (default: 4)
- Limit Celery concurrency: `--concurrency=2`
- Decrease `MAX_PAYLOAD_ROWS`

---

## 🔐 Security Considerations

1. **Input Validation**: All inputs validated via Pydantic schemas
2. **Payload Limits**: `MAX_PAYLOAD_ROWS` prevents DoS
3. **No PII Logging**: Structured logs exclude sensitive data
4. **CORS**: Configure `allow_origins` for production
5. **Rate Limiting**: Implement at reverse proxy level (nginx, Caddy)

---

## 📈 Production Deployment

### Checklist

- [ ] Set `DEBUG=False`
- [ ] Configure `LOG_FORMAT=json`
- [ ] Use external Redis (not in-container)
- [ ] Set up volume mounts for `/app/models`
- [ ] Configure `BACKEND_API_URL` for callbacks
- [ ] Enable health check monitoring
- [ ] Set resource limits (CPU, memory)
- [ ] Configure log aggregation (ELK, Datadog)
- [ ] Set up alerting for failures

### Scaling

- Horizontal: Run multiple API containers behind load balancer
- Celery workers: Scale independently based on queue depth
- Redis: Use Redis Cluster for high availability

---

## 🤝 Contributing

1. Write tests for new features
2. Follow existing code structure and documentation style
3. Use type hints throughout
4. Add docstrings with complexity notes
5. Run tests before committing: `pytest`

---

## 📄 License

Proprietary - All rights reserved

---

## 📧 Support

For issues or questions, contact the development team.

---

## 🎓 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Celery Documentation](https://docs.celeryproject.org/)
- [scikit-learn Documentation](https://scikit-learn.org/)
- [Pandas Optimization Guide](https://pandas.pydata.org/docs/user_guide/enhancingperf.html)
