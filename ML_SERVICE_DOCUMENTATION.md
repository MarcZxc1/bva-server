# ML Service Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Services](#core-services)
4. [API Endpoints](#api-endpoints)
5. [Data Flow](#data-flow)
6. [Integration with Main Server](#integration-with-main-server)
7. [Algorithms & Models](#algorithms--models)
8. [Caching & Performance](#caching--performance)
9. [Configuration](#configuration)

---

## Overview

The ML Service is a Python FastAPI microservice that provides AI-powered inventory management, demand forecasting, and marketing automation capabilities for the Business Virtual Assistant (BVA) platform. It operates as an independent service that communicates with the main Node.js/TypeScript server via HTTP REST APIs.

### Key Capabilities

1. **At-Risk Inventory Detection**: Identifies products that need attention due to low stock, near-expiry dates, or slow sales velocity
2. **Demand Forecasting**: Predicts future product demand using multiple ML algorithms
3. **Restocking Strategy**: Optimizes restocking decisions based on budget and business goals (profit, volume, or balanced)
4. **Promotion Planning**: Generates intelligent promotion recommendations for near-expiry or slow-moving products
5. **Sales Analytics & Insights**: Provides time-series analysis, trend detection, and business recommendations
6. **Ad Generation**: Creates AI-powered marketing content (copy and images) using Google Gemini

### Technology Stack

- **Framework**: FastAPI (Python 3.10+)
- **ML Libraries**: scikit-learn, XGBoost, pandas, numpy
- **Caching**: Redis
- **Background Tasks**: Celery
- **AI/LLM**: Google Gemini 2.0 Flash (for ad generation)
- **Logging**: structlog (structured JSON logging)

---

## Architecture

### Service Structure

```
ml-service/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Configuration management (Pydantic)
│   ├── routes/                 # API route handlers
│   │   ├── smart_shelf.py      # SmartShelf endpoints
│   │   ├── restock.py          # Restocking strategy endpoints
│   │   └── ads.py              # Ad generation endpoints
│   ├── services/               # Business logic layer
│   │   ├── inventory_service.py      # At-risk detection
│   │   ├── forecast_service.py        # Demand forecasting
│   │   ├── restock_service.py         # Restocking optimization
│   │   ├── promotion_service.py       # Promotion planning
│   │   ├── insights_service.py        # Sales analytics
│   │   ├── ad_service.py              # Ad generation
│   │   └── social_media_service.py    # Social media posting
│   ├── models/                 # ML model management
│   │   ├── trainer.py          # Model training logic
│   │   └── persistence.py      # Model save/load
│   ├── schemas/                # Pydantic request/response models
│   ├── utils/                  # Utility functions
│   │   ├── caching.py          # Redis cache management
│   │   ├── pandas_utils.py     # Data processing utilities
│   │   └── explainability.py   # Model explainability
│   └── tasks/                  # Celery background tasks
│       ├── celery_app.py       # Celery configuration
│       └── scheduled_tasks.py  # Scheduled job definitions
```

### Communication Flow

```
┌─────────────────┐
│  BVA Frontend   │
│  (React/TS)     │
└────────┬────────┘
         │ HTTP/JSON
         ↓
┌─────────────────────────────────┐
│  Main Server (Node.js/Express)  │
│  - Fetches data from PostgreSQL │
│  - Transforms data format       │
│  - Calls ML Service             │
└────────┬────────────────────────┘
         │ HTTP/JSON (REST API)
         ↓
┌─────────────────────────────────┐
│     ML Service (FastAPI)        │
│  ┌───────────────────────────┐  │
│  │  Routes Layer             │  │
│  │  - Request validation      │  │
│  │  - Error handling          │  │
│  └──────────┬────────────────┘  │
│             ↓                    │
│  ┌───────────────────────────┐  │
│  │  Services Layer           │  │
│  │  - Business logic         │  │
│  │  - Algorithm execution    │  │
│  └──────────┬────────────────┘  │
│             ↓                    │
│  ┌───────────────────────────┐  │
│  │  Models & Utils           │  │
│  │  - ML model training      │  │
│  │  - Data processing        │  │
│  │  - Caching (Redis)        │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

---

## Core Services

### 1. Inventory Service (`inventory_service.py`)

**Purpose**: Detects at-risk inventory items that need attention.

**Key Functions**:
- `compute_risk_scores()`: Main entry point for at-risk detection

**Risk Detection Types**:
1. **Low Stock**: Products below threshold quantity
   - Formula: `0.3 * (1 - qty/threshold)`
   - Triggers when `quantity <= low_stock_threshold`

2. **Near Expiry**: Products expiring soon
   - Formula: `0.4 * (1 - days_left/warning_days)`
   - Triggers when `days_to_expiry <= expiry_warning_days`

3. **Slow Moving**: Products with poor sales velocity
   - Formula: `0.3 * (1 - velocity/threshold)`
   - Triggers when `avg_daily_sales < slow_moving_threshold`

**Risk Score Calculation**:
- Each risk type contributes to a normalized score (0-1)
- Total score = sum of applicable risk components
- Higher score = higher priority

**Recommended Actions**:
- `restock`: For low stock items
- `promotion`: For near-expiry or slow-moving items
- `clearance`: For expired items
- `bundle`: For slow-moving items that can be bundled

**Performance**: O(n log n) due to pandas groupby operations, handles 10K+ products efficiently

---

### 2. Forecast Service (`forecast_service.py`)

**Purpose**: Predicts future product demand using time-series forecasting.

**Key Functions**:
- `forecast_demand()`: Forecast for a single product
- `batch_forecast()`: Forecast multiple products efficiently
- `get_or_train_model()`: Load cached model or train new one

**Forecasting Methods**:

1. **Auto Selection** (default):
   - Analyzes data characteristics
   - Selects best method automatically
   - Considers data size, trend, seasonality

2. **Linear Regression**:
   - Simple trend-based forecasting
   - Fast, suitable for stable products
   - Best for: Products with linear trends

3. **Exponential Smoothing**:
   - Handles trends and seasonality
   - Good for products with patterns
   - Best for: Seasonal or trending products

4. **XGBoost**:
   - Advanced gradient boosting
   - Handles complex patterns
   - Best for: Products with rich history (>30 days)

**Caching Strategy**:
- **Level 1**: Redis cache for identical requests (instant, 24h TTL)
- **Level 2**: Disk-persisted models (fast load ~50ms)
- **Level 3**: Train new model (~100-500ms depending on method)

**Output**:
- Point forecasts for each period
- Confidence intervals (default 95%)
- Feature importance (for XGBoost)
- Textual explanation of predictions

---

### 3. Restock Service (`restock_service.py`)

**Purpose**: Optimizes restocking decisions based on budget and business goals.

**Key Functions**:
- `compute_restock_strategy()`: Main orchestrator
- `profit_maximization()`: Greedy algorithm for profit optimization
- `volume_maximization()`: Greedy algorithm for volume optimization
- `balanced_strategy()`: Weighted hybrid approach

**Optimization Strategies**:

1. **Profit Maximization** (`goal: "profit"`):
   - Prioritizes products with highest `profit_margin × demand`
   - Maximizes expected profit within budget
   - Algorithm: Greedy selection by priority score
   - Priority Score = `profit_margin × avg_daily_sales × urgency_factor`

2. **Volume Maximization** (`goal: "volume"`):
   - Prioritizes products with highest turnover
   - Maximizes units and inventory turnover
   - Algorithm: Greedy selection by volume score
   - Priority Score = `avg_daily_sales × (1 - current_stock_coverage)`

3. **Balanced Growth** (`goal: "balanced"`):
   - 50/50 weighted hybrid of profit and volume
   - Balances profit margins with sales velocity
   - Algorithm: Weighted combination of both strategies

**Input Requirements**:
- Product list with: `product_id`, `name`, `price`, `cost`, `stock`, `avg_daily_sales`, `profit_margin`
- Budget constraint
- Restock days (target coverage period, default: 14 days)

**Output**:
- Recommended products with quantities
- Total cost, expected revenue, expected profit
- ROI calculation
- Reasoning for each recommendation
- Warnings for budget constraints or data issues

**Performance**: O(n log n) due to sorting, suitable for up to 10,000 products

---

### 4. Promotion Service (`promotion_service.py`)

**Purpose**: Generates intelligent promotion recommendations for at-risk products.

**Key Functions**:
- `generate_promotions()`: Main entry point
- Pairs near-expiry products with calendar events
- Calculates optimal discount rates
- Generates marketing copy

**Promotion Logic**:
1. **Event Pairing**: Matches products with relevant calendar events (holidays, seasons)
2. **Discount Optimization**: Calculates discount that:
   - Respects minimum margin constraints
   - Maximizes demand increase (elasticity model)
   - Ensures profitability
3. **Clearance Estimation**: Predicts days to sell-through at discount rate
4. **Confidence Scoring**: Risk assessment for each promotion

**Discount Calculation**:
- Uses elasticity multiplier: `demand_increase = discount_pct × elasticity_multiplier`
- Respects `min_margin_pct` constraint
- Caps at `max_discount_pct` (default: 40%)

**Output**:
- Promotion recommendations with:
  - Suggested discount percentage
  - Marketing copy
  - Event pairing
  - Expected sell-through time
  - Confidence score

---

### 5. Insights Service (`insights_service.py`)

**Purpose**: Provides sales analytics and business insights.

**Key Functions**:
- `generate_insights()`: Main entry point
- Time-series aggregation
- Trend detection
- Top products analysis
- Seasonality detection

**Analytics Provided**:
1. **Time-Series Data**: Daily, weekly, monthly aggregations
2. **Moving Averages**: 7-day and 30-day trend smoothing
3. **Top Products**: Top-K analysis with trend indicators
4. **Seasonality**: Day-of-week and monthly patterns
5. **Business Recommendations**: Actionable insights in plain text

**Output Format**:
- Aggregated sales data by time period
- Trend indicators (increasing, decreasing, stable)
- Top products with growth rates
- Seasonality patterns
- Plain-text business recommendations

---

### 6. Ad Service (`ad_service.py`)

**Purpose**: Generates AI-powered marketing content using Google Gemini.

**Key Functions**:
- `generate_ad_content()`: Main entry point
- Generates ad copy using playbook system
- Generates ad images using Imagen model
- Combines copy and images for complete ads

**Playbook System**:
1. **Flash Sale**: Urgent, time-sensitive promotions
2. **New Arrival**: Product launches and new stock
3. **Best Seller Spotlight**: Social proof and bestsellers
4. **Bundle Up!**: Value bundles and multi-product deals

**AI Models Used**:
- **Gemini 2.0 Flash**: For ad copy generation
- **Gemini 2.5 Flash Image (Imagen)**: For image generation

**Output**:
- Ad copy (ready-to-post social media text)
- Hashtags (relevant to product and playbook)
- Image URL (base64 encoded or external URL)

---

## API Endpoints

### Base URL
- Development: `http://localhost:8001`
- Production: Configured via `ML_SERVICE_URL` environment variable

### API Prefix
All endpoints are prefixed with `/api/v1`

---

### SmartShelf Endpoints

#### 1. At-Risk Inventory Detection
**Endpoint**: `POST /api/v1/smart-shelf/at-risk`

**Purpose**: Identifies products that need attention (low stock, near-expiry, slow-moving).

**Request Body**:
```json
{
  "shop_id": "SHOP-001",
  "inventory": [
    {
      "product_id": "PROD-001",
      "sku": "SKU-001",
      "name": "Product Name",
      "quantity": 5,
      "price": 100.0,
      "expiry_date": "2024-12-31T00:00:00Z",
      "categories": ["Category1"]
    }
  ],
  "sales": [
    {
      "product_id": "PROD-001",
      "date": "2024-01-15T00:00:00Z",
      "qty": 10,
      "revenue": 1000.0
    }
  ],
  "thresholds": {
    "low_stock": 10,
    "expiry_warning_days": 7,
    "slow_moving_window": 30,
    "slow_moving_threshold": 0.5
  }
}
```

**Response**:
```json
{
  "at_risk": [
    {
      "product_id": "PROD-001",
      "sku": "SKU-001",
      "name": "Product Name",
      "current_quantity": 5,
      "price": 100.0,
      "reasons": ["low_stock", "near_expiry"],
      "score": 0.75,
      "days_to_expiry": 5,
      "avg_daily_sales": 2.5,
      "recommended_action": {
        "action_type": "restock",
        "reasoning": "Stock is critically low (5 units). Restock to avoid stockouts.",
        "restock_qty": 30
      }
    }
  ],
  "meta": {
    "shop_id": "SHOP-001",
    "total_products": 1,
    "flagged_count": 1,
    "analysis_date": "2024-01-20T10:00:00Z",
    "thresholds_used": {...}
  }
}
```

**Flow**:
1. Main server fetches products and sales from PostgreSQL
2. Transforms data to ML service format
3. Calls ML service endpoint
4. ML service computes risk scores using pandas vectorized operations
5. Returns prioritized list of at-risk items
6. Main server caches result (5 min TTL) and returns to frontend

---

#### 2. Demand Forecasting
**Endpoint**: `POST /api/v1/smart-shelf/forecast`

**Purpose**: Predicts future product demand.

**Request Body**:
```json
{
  "shop_id": "SHOP-001",
  "product_id": "PROD-001",
  "periods": 14,
  "model": "auto",
  "confidence_interval": 0.95,
  "sales": [
    {
      "product_id": "PROD-001",
      "date": "2024-01-01T00:00:00Z",
      "qty": 10,
      "revenue": 1000.0
    }
  ]
}
```

**Response**:
```json
{
  "forecasts": [
    {
      "product_id": "PROD-001",
      "method": "exponential_smoothing",
      "predictions": [
        {
          "period": 1,
          "date": "2024-01-21",
          "forecast": 12.5,
          "lower_bound": 10.0,
          "upper_bound": 15.0
        }
      ],
      "metadata": {
        "model_accuracy": 0.92,
        "feature_importance": {...}
      }
    }
  ],
  "meta": {
    "shop_id": "SHOP-001",
    "forecast_date": "2024-01-20T10:00:00Z",
    "total_products": 1,
    "cache_hit": false
  }
}
```

**Flow**:
1. Main server fetches historical sales data
2. Calls ML service with sales history
3. ML service checks Redis cache first
4. If cache miss, loads or trains model
5. Generates forecasts with confidence intervals
6. Caches result in Redis (24h TTL)
7. Returns forecasts to main server

---

#### 3. Promotion Planning
**Endpoint**: `POST /api/v1/smart-shelf/promotions`

**Purpose**: Generates promotion recommendations for at-risk products.

**Request Body**:
```json
{
  "shop_id": "SHOP-001",
  "items": [
    {
      "product_id": "PROD-001",
      "name": "Product Name",
      "current_quantity": 50,
      "price": 100.0,
      "cost": 60.0,
      "days_to_expiry": 5
    }
  ],
  "calendar_events": [
    {
      "event_name": "Valentine's Day",
      "date": "2024-02-14",
      "category": "holiday"
    }
  ],
  "preferences": {
    "max_discount_pct": 40.0,
    "min_margin_pct": 10.0
  }
}
```

**Response**:
```json
{
  "promotions": [
    {
      "product_id": "PROD-001",
      "event_name": "Valentine's Day",
      "discount_pct": 25.0,
      "new_price": 75.0,
      "marketing_copy": "Special Valentine's Day promotion!...",
      "expected_sell_through_days": 3,
      "confidence": 0.85
    }
  ],
  "meta": {
    "shop_id": "SHOP-001",
    "total_items": 1,
    "total_events": 1,
    "promotions_generated": 1,
    "analysis_date": "2024-01-20T10:00:00Z"
  }
}
```

---

#### 4. Sales Insights
**Endpoint**: `POST /api/v1/smart-shelf/insights`

**Purpose**: Provides sales analytics and business insights.

**Request Body**:
```json
{
  "shop_id": "SHOP-001",
  "sales": [...],
  "range": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "granularity": "daily",
  "top_k": 10
}
```

**Response**:
```json
{
  "time_series": [
    {
      "date": "2024-01-01",
      "revenue": 1000.0,
      "units_sold": 50,
      "order_count": 10
    }
  ],
  "top_products": [
    {
      "product_id": "PROD-001",
      "name": "Product Name",
      "revenue": 5000.0,
      "units_sold": 250,
      "growth_rate": 0.15,
      "trend": "increasing"
    }
  ],
  "recommendations": [
    "Product PROD-001 is showing strong growth. Consider increasing stock levels.",
    "Focus marketing efforts on top-performing products."
  ],
  "meta": {...}
}
```

---

### Restock Endpoints

#### Restocking Strategy
**Endpoint**: `POST /api/v1/restock/strategy`

**Purpose**: Calculates optimal restocking strategy based on budget and goal.

**Request Body**:
```json
{
  "shop_id": "SHOP-001",
  "budget": 5000.0,
  "goal": "profit",
  "restock_days": 14,
  "products": [
    {
      "product_id": "PROD-001",
      "name": "Product Name",
      "price": 100.0,
      "cost": 60.0,
      "stock": 10,
      "category": "Category1",
      "avg_daily_sales": 5.0,
      "profit_margin": 0.4,
      "min_order_qty": 1
    }
  ]
}
```

**Response**:
```json
{
  "strategy": "profit",
  "shop_id": "SHOP-001",
  "budget": 5000.0,
  "items": [
    {
      "product_id": "PROD-001",
      "name": "Product Name",
      "qty": 163,
      "unit_cost": 60.0,
      "total_cost": 9780.0,
      "expected_profit": 6520.0,
      "expected_revenue": 16300.0,
      "days_of_stock": 13.6,
      "priority_score": 108.0,
      "reasoning": "High profit margin (40.0%), 5.0 units/day, urgency: 3.0x"
    }
  ],
  "totals": {
    "total_items": 1,
    "total_qty": 163,
    "total_cost": 9780.0,
    "budget_used_pct": 195.6,
    "expected_revenue": 16300.0,
    "expected_profit": 6520.0,
    "expected_roi": 66.67,
    "avg_days_of_stock": 13.6
  },
  "reasoning": [
    "Strategy: Profit Maximization - Prioritize high-margin, fast-moving items",
    "Budget: ₱5,000.00",
    "Target: 14 days of stock",
    "Selected 1 products with highest profit potential"
  ],
  "warnings": []
}
```

**Flow**:
1. User submits restock request from BVA frontend (Restock Planner page)
2. Main server validates request and checks for active integration
3. Main server fetches products, inventory, and sales data from PostgreSQL
4. Calculates `avg_daily_sales` and `profit_margin` for each product
5. Transforms data to ML service format
6. Calls ML service `/api/v1/restock/strategy` endpoint
7. ML service runs optimization algorithm (profit/volume/balanced)
8. Returns recommendations with quantities, costs, and reasoning
9. Main server transforms response and returns to frontend
10. Frontend displays recommendations in shopping list modal

---

### Ad Generation Endpoints

#### 1. Generate Complete Ad
**Endpoint**: `POST /api/v1/ads/generate`

**Purpose**: Generates complete ad content (copy + image) using AI.

**Request Body**:
```json
{
  "product_name": "UFC Banana Catsup",
  "playbook": "flash_sale",
  "discount": 25.0
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "ad_copy": "🔥 FLASH SALE! Get 25% OFF on UFC Banana Catsup...",
    "hashtags": ["#FlashSale", "#UFC", "#BananaCatsup"],
    "image_url": "data:image/png;base64,..."
  }
}
```

#### 2. Generate Ad Copy Only
**Endpoint**: `POST /api/v1/ads/generate-copy`

**Purpose**: Generates only ad copy (no image, faster).

#### 3. Generate Ad Image Only
**Endpoint**: `POST /api/v1/ads/generate-image`

**Purpose**: Generates only ad image (no copy).

#### 4. Generate and Post to Social Media
**Endpoint**: `POST /api/v1/ads/generate-and-post`

**Purpose**: Generates ad content and posts directly to Facebook/Instagram.

---

### Health & Metrics

#### Health Check
**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "components": {
    "cache": "up"
  }
}
```

#### Metrics
**Endpoint**: `GET /metrics`

**Response**:
```json
{
  "service": "SmartShelf ML Service",
  "version": "1.0.0"
}
```

---

## Data Flow

### 1. At-Risk Inventory Detection Flow

```
┌─────────────┐
│ BVA Frontend│
│ SmartShelf  │
│   Page      │
└──────┬──────┘
       │ 1. User visits SmartShelf page
       ↓
┌──────────────────────────────────┐
│ Main Server                      │
│ GET /api/smart-shelf/:shopId/    │
│     at-risk                      │
└──────┬───────────────────────────┘
       │ 2. Check Redis cache (5 min TTL)
       │ 3. If cache miss:
       │    - Fetch products from PostgreSQL
       │    - Fetch sales (last 60 days)
       │    - Transform to ML service format
       ↓
┌──────────────────────────────────┐
│ ML Service                       │
│ POST /api/v1/smart-shelf/at-risk │
└──────┬───────────────────────────┘
       │ 4. Compute risk scores:
       │    - Low stock detection
       │    - Near-expiry detection
       │    - Slow-moving detection
       │    - Generate recommendations
       ↓
┌──────────────────────────────────┐
│ Main Server                      │
│ - Cache result (5 min TTL)       │
│ - Transform response              │
│ - Return to frontend              │
└──────┬───────────────────────────┘
       │ 5. Display at-risk items
       ↓
┌─────────────┐
│ BVA Frontend│
│ - Show cards │
│ - Badges     │
│ - Actions    │
└─────────────┘
```

### 2. Restock Strategy Flow

```
┌─────────────┐
│ BVA Frontend│
│ Restock     │
│ Planner     │
└──────┬──────┘
       │ 1. User enters budget & goal
       │    Clicks "Generate Restock Plan"
       ↓
┌──────────────────────────────────┐
│ Main Server                      │
│ POST /api/ai/restock-strategy    │
│ - Validate request                │
│ - Check active integration        │
└──────┬───────────────────────────┘
       │ 2. Fetch data:
       │    - Products (with inventory)
       │    - Sales (last 90 days)
       │    - Calculate avg_daily_sales
       │    - Calculate profit_margin
       ↓
┌──────────────────────────────────┐
│ ML Service                       │
│ POST /api/v1/restock/strategy    │
│ - Filter valid products           │
│ - Run optimization algorithm      │
│   (profit/volume/balanced)        │
│ - Calculate quantities            │
│ - Generate reasoning              │
└──────┬───────────────────────────┘
       │ 3. Return recommendations
       ↓
┌──────────────────────────────────┐
│ Main Server                      │
│ - Transform response              │
│ - Emit socket event               │
│ - Return to frontend              │
└──────┬───────────────────────────┘
       │ 4. Display recommendations
       │    Show "Approve" button
       ↓
┌─────────────┐
│ BVA Frontend│
│ - Shopping  │
│   list modal│
│ - PDF export│
└─────────────┘
```

### 3. Demand Forecasting Flow

```
┌─────────────┐
│ BVA Frontend│
│ Reports     │
│   Page      │
└──────┬──────┘
       │ 1. User requests forecast
       ↓
┌──────────────────────────────────┐
│ Main Server                      │
│ - Fetch historical sales         │
│ - Prepare sales DataFrame         │
└──────┬───────────────────────────┘
       │ 2. Call ML service
       ↓
┌──────────────────────────────────┐
│ ML Service                       │
│ POST /api/v1/smart-shelf/forecast│
│ - Check Redis cache               │
│ - If cache miss:                 │
│   - Load or train model           │
│   - Generate forecasts            │
│   - Cache result (24h TTL)        │
└──────┬───────────────────────────┘
       │ 3. Return forecasts
       ↓
┌──────────────────────────────────┐
│ Main Server                      │
│ - Transform response              │
│ - Return to frontend              │
└──────┬───────────────────────────┘
       │ 4. Display charts
       ↓
┌─────────────┐
│ BVA Frontend│
│ - Forecast  │
│   charts    │
│ - Insights  │
└─────────────┘
```

---

## Integration with Main Server

### ML Client Utility (`server/src/utils/mlClient.ts`)

The main server uses a dedicated ML client utility to communicate with the ML service.

**Key Functions**:
- `mlClient.post<T>(endpoint, data)`: Send POST requests
- `mlClient.get<T>(endpoint)`: Send GET requests
- `mlClient.healthCheck()`: Check ML service availability

**Configuration**:
- Base URL: `process.env.ML_SERVICE_URL || "http://localhost:8001"`
- Timeout: Configurable (default: 30 seconds)
- Error handling: Automatic retries and fallback logic

### Service Layer Integration

#### 1. SmartShelf Service (`server/src/service/smartShelf.service.ts`)

**Function**: `getAtRiskInventory(shopId: string)`

**Flow**:
1. Checks for active integration (data isolation)
2. Fetches products with `externalId` (synced products only)
3. Fetches sales history (last 60 days)
4. Transforms to ML service format
5. Calls ML service `/api/v1/smart-shelf/at-risk`
6. Caches result in Redis (5 min TTL)
7. Returns at-risk items

**Data Transformation**:
- PostgreSQL products → `MLInventoryItem[]`
- PostgreSQL sales → `MLSalesRecord[]`

#### 2. Restock Service (`server/src/service/restock.service.ts`)

**Function**: `getRestockRecommendations(shopId, budget, goal, restockDays)`

**Flow**:
1. Checks for active integration
2. Fetches products with inventory
3. Fetches sales (last 60 days)
4. Calculates `avg_daily_sales` per product
5. Calculates `profit_margin` per product
6. Transforms to `MLProductInput[]` format
7. Calls ML service `/api/v1/restock/strategy`
8. Transforms response to frontend format
9. Returns recommendations

**Data Transformation**:
- PostgreSQL products → `MLProductInput[]` with:
  - `product_id`, `name`, `price`, `cost`, `stock`
  - `avg_daily_sales` (calculated from sales history)
  - `profit_margin` (calculated: `(price - cost) / price`)
  - `category`, `min_order_qty`

### Controller Layer

#### Restock Controller (`server/src/controllers/restock.controller.ts`)

**Endpoint**: `POST /api/ai/restock-strategy`

**Responsibilities**:
- Request validation
- Integration check
- Data fetching and transformation
- ML service communication
- Error handling with detailed logging
- Socket event emission for real-time updates

#### SmartShelf Controller (`server/src/controllers/smartShelf.controller.ts`)

**Endpoints**:
- `GET /api/smart-shelf/:shopId/at-risk`
- `GET /api/smart-shelf/:shopId/dashboard`

**Responsibilities**:
- Request validation
- Data fetching
- ML service communication
- Fallback to basic rule-based detection if ML service unavailable
- Response transformation

---

## Algorithms & Models

### 1. At-Risk Detection Algorithm

**Input**: Inventory items, sales history, thresholds

**Process**:
1. Convert to pandas DataFrames for vectorized operations
2. Compute sales velocity per product (rolling average)
3. Detect each risk type independently:
   - Low stock: `quantity <= threshold`
   - Near expiry: `days_to_expiry <= warning_days`
   - Slow moving: `avg_daily_sales < threshold`
4. Calculate risk scores (normalized 0-1)
5. Generate recommendations based on risk profile
6. Sort by score (descending)

**Performance**: O(n log n) for groupby operations, handles 10K+ products

---

### 2. Demand Forecasting Models

#### Linear Regression
- **Use Case**: Products with stable, linear trends
- **Training Time**: ~50ms
- **Accuracy**: Good for stable products
- **Features**: Date, lag features, rolling averages

#### Exponential Smoothing
- **Use Case**: Products with trends and seasonality
- **Training Time**: ~100ms
- **Accuracy**: Good for seasonal patterns
- **Features**: Time-series decomposition

#### XGBoost
- **Use Case**: Products with complex patterns, rich history
- **Training Time**: ~200-500ms (depends on data size)
- **Accuracy**: Best for complex patterns
- **Features**: Lag features, rolling statistics, trend indicators, day-of-week, month

**Auto Selection Logic**:
- If data points < 14: Use Linear Regression
- If data points < 30: Use Exponential Smoothing
- If data points >= 30: Use XGBoost
- If strong seasonality detected: Prefer Exponential Smoothing

---

### 3. Restocking Optimization Algorithms

#### Profit Maximization (Greedy Algorithm)

**Algorithm**:
1. Calculate priority score for each product:
   ```
   priority_score = profit_margin × avg_daily_sales × urgency_factor
   ```
   Where `urgency_factor = max(1.0, (restock_days × avg_daily_sales) / current_stock)`

2. Sort products by priority score (descending)

3. Iterate through sorted products:
   - Calculate required quantity: `qty = restock_days × avg_daily_sales - current_stock`
   - Calculate cost: `cost = qty × unit_cost`
   - If `cost <= remaining_budget`:
     - Add to recommendations
     - Subtract from budget
   - Else:
     - Calculate partial quantity that fits budget
     - Add partial recommendation

**Time Complexity**: O(n log n) due to sorting

#### Volume Maximization (Greedy Algorithm)

**Algorithm**:
1. Calculate volume score for each product:
   ```
   volume_score = avg_daily_sales × (1 - current_stock_coverage)
   ```
   Where `current_stock_coverage = current_stock / (restock_days × avg_daily_sales)`

2. Sort by volume score (descending)

3. Iterate and select products (same as profit maximization)

#### Balanced Strategy

**Algorithm**:
1. Run both profit and volume maximization
2. Weight each result: `50% profit + 50% volume`
3. Merge recommendations, prioritizing higher-weighted items
4. Optimize quantities to fit budget

---

## Caching & Performance

### Redis Caching Strategy

**Cache Keys**:
- At-risk inventory: `at-risk:{shopId}` (5 min TTL)
- Forecasts: `forecast:{shopId}:{productId}:{periods}:{method}:{dataHash}` (24h TTL)
- Models: Disk-persisted in `MODEL_DIR` (7 days cache)

**Cache Manager** (`app/utils/caching.py`):
- Automatic cache key generation
- TTL management
- Cache invalidation
- Fallback when Redis unavailable

### Performance Optimizations

1. **Vectorized Operations**: All data processing uses pandas/numpy (no Python loops)
2. **Model Caching**: Trained models saved to disk, loaded when needed
3. **Batch Processing**: Multiple products forecasted in single request
4. **Redis Caching**: Frequently accessed data cached in Redis
5. **Lazy Loading**: Models loaded only when needed

**Typical Response Times**:
- At-risk detection: <100ms (10K products)
- Single product forecast: 1-500ms (cache hit: 1ms, model load: 50ms, training: 100-500ms)
- Restock strategy: <200ms (1000 products)
- Ad generation: 2-5 seconds (AI API calls)

---

## Configuration

### Environment Variables

See `ml-service/.env.example` for complete list. Key variables:

**Application**:
- `PORT`: Service port (default: 8001)
- `LOG_LEVEL`: Logging level (INFO, DEBUG, etc.)
- `LOG_FORMAT`: `json` or `console`

**Redis**:
- `REDIS_URL`: Redis connection URL
- `REDIS_CACHE_TTL`: Cache TTL in seconds

**ML Models**:
- `MODEL_DIR`: Directory for saved models
- `DEFAULT_FORECAST_METHOD`: `auto`, `linear`, `exponential`, `xgboost`

**AI/LLM**:
- `GEMINI_API_KEY`: Google Gemini API key (for ad generation)
- `GEMINI_MODEL`: Model name (default: `gemini-2.0-flash-exp`)
- `IMAGEN_MODEL`: Image generation model (default: `gemini-2.5-flash-image`)

**Thresholds**:
- `DEFAULT_LOW_STOCK_THRESHOLD`: Default low stock threshold (default: 10)
- `DEFAULT_EXPIRY_WARNING_DAYS`: Days before expiry to warn (default: 7)
- `DEFAULT_SLOW_MOVING_THRESHOLD`: Slow moving threshold (default: 0.5 units/day)

---

## Error Handling

### ML Service Error Responses

**400 Bad Request**: Invalid input data
```json
{
  "detail": "Budget must be greater than 0"
}
```

**422 Unprocessable Entity**: Pydantic validation errors
```json
{
  "detail": [
    {
      "loc": ["body", "products", 0, "price"],
      "msg": "value is not a valid float",
      "type": "type_error.float"
    }
  ]
}
```

**500 Internal Server Error**: ML service errors
```json
{
  "detail": "Failed to process at-risk detection"
}
```

### Main Server Fallback Logic

**At-Risk Detection**:
- If ML service unavailable: Falls back to basic rule-based detection
- Returns same response format for frontend compatibility

**Restock Strategy**:
- If ML service unavailable: Returns 503 Service Unavailable
- Provides helpful error message with troubleshooting steps

---

## Deployment

### Docker Deployment

The ML service is containerized and can be deployed via Docker Compose:

```yaml
ml-service:
  build:
    context: ./ml-service
    dockerfile: Dockerfile
  ports:
    - "8001:8001"
  environment:
    - REDIS_URL=redis://redis:6379/0
    - GEMINI_API_KEY=${GEMINI_API_KEY}
  depends_on:
    - redis
```

### Standalone Deployment

```bash
cd ml-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

### Health Monitoring

- Health endpoint: `GET /health`
- Metrics endpoint: `GET /metrics`
- Structured logging: JSON format for production monitoring

---

## Summary

The ML Service is a critical component of the BVA platform, providing:

1. **Intelligent Inventory Management**: At-risk detection, demand forecasting
2. **Optimization Algorithms**: Restocking strategies, promotion planning
3. **AI-Powered Marketing**: Ad generation using Google Gemini
4. **Analytics & Insights**: Sales analysis, trend detection, recommendations

It operates as an independent microservice, communicating with the main server via REST APIs, enabling:
- **Scalability**: Can be scaled independently
- **Technology Flexibility**: Python ecosystem for ML/AI
- **Performance**: Optimized with caching and vectorized operations
- **Reliability**: Fallback mechanisms and error handling

The service integrates seamlessly with the main Node.js server, providing AI capabilities while maintaining separation of concerns and allowing independent deployment and scaling.

