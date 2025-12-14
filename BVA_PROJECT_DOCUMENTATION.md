# Business Virtual Assistant (BVA) - Complete Project Documentation

## Table of Contents

1. [Introduction - Project Overview](#introduction---project-overview) - **CODI**
2. [Dashboard](#dashboard) - **JULS**
3. [SmartShelf](#smartshelf) - **DAGS**
4. [Restock Planner](#restock-planner) - **DAGS**
5. [MarketMate](#marketmate) - **CODI**
6. [Reports](#reports) - **BOLITO**
7. [Settings (API Integration)](#settings-api-integration) - **JEFF**

---

## Introduction - Project Overview

**Assigned to: CODI**

### Problem Statement

Small and medium-sized businesses (SMBs) in the Philippines face significant challenges in managing their inventory, optimizing restocking decisions, and creating effective marketing campaigns. Traditional inventory management systems are often:

- **Expensive**: Enterprise solutions are cost-prohibitive for small businesses
- **Complex**: Require extensive training and technical knowledge
- **Disconnected**: Don't integrate with popular e-commerce platforms like Shopee
- **Reactive**: Don't provide predictive insights or AI-powered recommendations
- **Time-consuming**: Manual processes for restocking, promotions, and reporting

### Solution: Business Virtual Assistant (BVA)

BVA is a comprehensive, AI-powered business management platform designed specifically for Filipino SMBs. It provides:

1. **Intelligent Inventory Management**: AI-powered risk detection for low stock, near-expiry items, and slow-moving products
2. **Demand Forecasting**: Machine learning algorithms predict future product demand
3. **Optimized Restocking**: AI-driven recommendations for restocking based on budget and business goals
4. **Marketing Automation**: AI-generated ad content and promotion planning
5. **Comprehensive Analytics**: Real-time dashboards and detailed business reports
6. **Platform Integration**: Seamless integration with Shopee-Clone and other e-commerce platforms

### Key Features

- **Real-time Dashboard**: Business metrics, sales trends, and actionable insights
- **SmartShelf**: At-risk inventory detection with actionable recommendations
- **Restock Planner**: AI-powered restocking strategy optimization
- **MarketMate**: AI-generated marketing content and campaign management
- **Reports**: Comprehensive business analytics and exportable reports
- **Settings**: Multi-platform integration management

### Technology Stack

**Frontend:**
- React 18+ with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Shadcn UI components
- React Query for data fetching
- Recharts for data visualization

**Backend:**
- Node.js with Express
- TypeScript for type safety
- Prisma ORM for database management
- PostgreSQL for data persistence
- Redis for caching
- Socket.io for real-time updates

**ML Service:**
- Python 3.10+ with FastAPI
- scikit-learn, XGBoost for ML models
- pandas, numpy for data processing
- Google Gemini API for AI content generation

**Infrastructure:**
- Docker for containerization
- PostgreSQL database
- Redis for caching
- RESTful API architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    BVA Frontend (React)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │Dashboard │  │SmartShelf│  │ Restock  │  │MarketMate│  │
│  │          │  │          │  │ Planner  │  │          │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │             │              │             │         │
│  ┌────┴─────────────┴──────────────┴─────────────┴─────┐  │
│  │              Reports & Settings                      │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP/JSON + WebSocket
                        ↓
┌─────────────────────────────────────────────────────────────┐
│              Backend Server (Node.js/Express)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Routes     │  │  Controllers │  │   Services   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │              │
│  ┌──────┴─────────────────┴─────────────────┴──────┐     │
│  │         Business Logic & Data Processing         │     │
│  └───────────────────────┬──────────────────────────┘     │
└──────────────────────────┼─────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ↓                  ↓                  ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │    Redis     │  │  ML Service  │
│  Database    │  │    Cache     │  │  (FastAPI)   │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Data Flow

1. **User Interaction**: User interacts with BVA frontend (React components)
2. **API Request**: Frontend makes HTTP requests to backend server
3. **Authentication**: JWT token validates user identity
4. **Business Logic**: Backend services process requests
5. **Data Fetching**: Services query PostgreSQL database
6. **ML Processing**: Complex calculations forwarded to ML service
7. **Caching**: Redis caches frequently accessed data
8. **Real-time Updates**: Socket.io emits updates to connected clients
9. **Response**: Data returned to frontend and displayed

### Integration with Shopee-Clone

BVA integrates with Shopee-Clone through:

- **SSO Authentication**: Users can log in to both platforms with the same account
- **Data Synchronization**: Products, orders, and sales data sync from Shopee-Clone to BVA
- **Platform Integration**: Settings page allows users to connect their Shopee-Clone account
- **Terms & Conditions**: Users must accept terms before data sync is enabled
- **Data Isolation**: BVA only displays data after explicit integration and terms acceptance

---

## Dashboard

**Assigned to: JULS**

### Overview

The Dashboard is the central hub of the BVA platform, providing real-time business metrics, sales trends, and actionable insights. It serves as the first point of contact for users after logging in.

### Key Features

1. **Business Metrics Cards**:
   - Total Revenue (with trend indicators)
   - Total Profit (with trend indicators)
   - Total Sales (order count)
   - Total Products (inventory count)

2. **Sales Forecast Chart**:
   - 14-day demand forecast
   - Visual trend representation
   - Confidence intervals

3. **Stock Alerts**:
   - Top 5 at-risk products
   - Risk scores and status indicators
   - Quick action buttons

4. **Real-time Updates**:
   - WebSocket connection for live data
   - Automatic refresh on data changes
   - Connection status indicator

5. **Quick Actions**:
   - Navigate to SmartShelf
   - Navigate to Restock Planner
   - Sync data from Shopee-Clone

### Technical Implementation

#### Frontend Component

**File**: `bva-frontend/src/pages/Dashboard.tsx`

**Key Hooks Used**:
- `useAuth()`: Get current user and shop information
- `useIntegration()`: Check if Shopee-Clone is connected
- `useAtRiskInventory()`: Fetch at-risk products
- `useDashboardAnalytics()`: Fetch dashboard metrics
- `useRealtimeDashboard()`: Enable real-time updates

**Data Fetching**:
```typescript
const { data: atRiskData } = useAtRiskInventory(shopId, hasActiveIntegration);
const { data: analyticsData } = useDashboardAnalytics(shopId, hasActiveIntegration);
const { isConnected } = useRealtimeDashboard({ shopId, enabled: hasActiveIntegration });
```

#### Backend Service

**File**: `server/src/service/smartShelf.service.ts`

**Function**: `getDashboardAnalytics(shopId: string)`

**Process**:
1. Check for active Shopee-Clone integration
2. If no integration, return empty/default data
3. Fetch sales data from PostgreSQL (last 30-90 days)
4. Calculate metrics (revenue, profit, sales count)
5. Call ML service for demand forecasting
6. Aggregate top products and recent sales
7. Cache result in Redis (10 min TTL)
8. Return comprehensive dashboard data

**API Endpoint**: `GET /api/smart-shelf/:shopId/dashboard`

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "totalRevenue": 50000,
    "totalProfit": 15000,
    "totalSales": 250,
    "totalProducts": 45,
    "recentSales": [...],
    "topProducts": [...],
    "salesForecast": [...],
    "insights": [...]
  }
}
```

### Integration Requirements

**Data Isolation**:
- Dashboard only displays data if user has active Shopee-Clone integration
- Integration must have `termsAccepted: true` and `isActive: true`
- Shows "Integration Required" message if not connected

**Real-time Updates**:
- Socket.io connection established on component mount
- Listens to `dashboard_update` events
- Automatically refreshes data when updates received

**Caching Strategy**:
- Redis cache with 10-minute TTL
- Cache key: `dashboard-analytics:{shopId}`
- Cache invalidated on data sync or manual refresh

### User Flow

1. User logs in to BVA
2. Dashboard page loads
3. System checks for active integration
4. If connected:
   - Fetch metrics from backend
   - Display business cards with data
   - Show sales forecast chart
   - Display stock alerts
   - Enable real-time updates
5. If not connected:
   - Show "Integration Required" message
   - Guide user to Settings page
   - Display empty state with instructions

### Error Handling

- **No Shop**: Shows welcome message and instructions
- **No Integration**: Shows integration required message
- **No Data**: Shows empty state with helpful guidance
- **API Errors**: Displays error message with retry option
- **Connection Loss**: Shows connection status indicator

---

## SmartShelf

**Assigned to: DAGS**

### Overview

SmartShelf is an AI-powered inventory management feature that identifies at-risk products requiring immediate attention. It uses machine learning algorithms to detect low stock, near-expiry items, and slow-moving products.

### Key Features

1. **At-Risk Inventory Detection**:
   - Low Stock: Products below threshold quantity
   - Near Expiry: Products expiring within warning period
   - Slow Moving: Products with poor sales velocity

2. **Risk Scoring**:
   - Normalized 0-100 risk scores
   - Priority-based sorting
   - Color-coded badges (Critical, High Risk, Medium Risk)

3. **Actionable Recommendations**:
   - Restock suggestions with quantities
   - Promotion recommendations for near-expiry items
   - Clearance suggestions for expired products
   - Bundle recommendations for slow-moving items

4. **Product Inventory Table**:
   - Complete product listing with status badges
   - Stock quantities and expiry dates
   - Platform information
   - Quick action buttons

5. **Metrics Display**:
   - Total products count
   - At-risk items count
   - Cancel items count
   - Analysis data summary

### Technical Implementation

#### Frontend Component

**File**: `bva-frontend/src/pages/SmartShelf.tsx`

**Key Hooks Used**:
- `useAuth()`: Get current user and shop
- `useIntegration()`: Check integration status
- `useAtRiskInventory()`: Fetch at-risk products
- `useProducts()`: Fetch all products for inventory table

**Data Fetching**:
```typescript
const { data: atRiskData } = useAtRiskInventory(shopId, hasShop);
const { data: products } = useProducts(shopId);
```

**Status Detection**:
```typescript
const getInventoryStatus = (product, quantity, expiryDate) => {
  const isLowStock = quantity <= 10;
  const isExpiringSoon = expiryDate ? {
    const daysUntilExpiry = calculateDaysUntilExpiry(expiryDate);
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  } : false;
  
  if (isExpiringSoon) return { label: "Expiring Soon", variant: "outline" };
  if (isLowStock) return { label: "Low Stock", variant: "destructive" };
  return { label: "Healthy", variant: "secondary" };
};
```

#### Backend Service

**File**: `server/src/service/smartShelf.service.ts`

**Function**: `getAtRiskInventory(shopId: string)`

**Process**:
1. Check for active Shopee-Clone integration
2. If no integration, return empty at-risk data
3. Fetch products with `externalId` (synced products only)
4. Fetch sales history (last 60 days)
5. Transform data to ML service format:
   - Products → `InventoryItem[]`
   - Sales → `SalesRecord[]`
6. Call ML service: `POST /api/v1/smart-shelf/at-risk`
7. Cache result in Redis (5 min TTL)
8. Return at-risk items with recommendations

**API Endpoint**: `GET /api/smart-shelf/:shopId/at-risk`

**ML Service Request**:
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

**ML Service Response**:
```json
{
  "at_risk": [
    {
      "product_id": "PROD-001",
      "name": "Product Name",
      "current_quantity": 5,
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
    "analysis_date": "2024-01-20T10:00:00Z"
  }
}
```

### ML Service Integration

**ML Service Endpoint**: `POST /api/v1/smart-shelf/at-risk`

**Algorithm**:
1. Convert inventory and sales to pandas DataFrames
2. Compute sales velocity per product (rolling average)
3. Detect each risk type:
   - Low stock: `quantity <= threshold`
   - Near expiry: `days_to_expiry <= warning_days`
   - Slow moving: `avg_daily_sales < threshold`
4. Calculate risk scores (normalized 0-1)
5. Generate recommendations based on risk profile
6. Sort by score (descending)

**Risk Score Formula**:
- Low stock: `0.3 * (1 - qty/threshold)`
- Near expiry: `0.4 * (1 - days_left/warning_days)`
- Slow moving: `0.3 * (1 - velocity/threshold)`
- Total: Sum of applicable components, normalized to 0-1

### Integration Requirements

**Data Isolation**:
- Only displays products with `externalId` (synced from Shopee-Clone)
- Requires active integration with terms accepted
- Shows "Integration Required" message if not connected

**Caching Strategy**:
- Redis cache with 5-minute TTL
- Cache key: `at-risk:{shopId}`
- Cache invalidated on product/sales updates

### User Flow

1. User navigates to SmartShelf page
2. System checks for active integration
3. If connected:
   - Fetch at-risk products from backend
   - Fetch all products for inventory table
   - Display metrics (total products, at-risk count)
   - Show at-risk items with recommendations
   - Display product inventory table with status badges
4. If not connected:
   - Show "Integration Required" message
   - Guide user to Settings page

### Status Badges

- **Low Stock** (Red): Quantity <= 10 units
- **Expiring Soon** (Orange): Expires within 30 days
- **Healthy** (Green): No issues detected

---

## Restock Planner

**Assigned to: DAGS**

### Overview

Restock Planner is an AI-powered feature that optimizes restocking decisions based on budget constraints and business goals. It uses machine learning algorithms to recommend which products to restock, in what quantities, and why.

### Key Features

1. **Restock Strategy Generation**:
   - Profit Maximization: Maximize profit margin × demand
   - Volume Maximization: Maximize inventory turnover
   - Balanced Growth: Hybrid approach balancing profit and volume

2. **Input Parameters**:
   - Budget: Available budget for restocking
   - Goal: profit, volume, or balanced
   - Restock Days: Target coverage period (default: 14 days)

3. **Recommendations Display**:
   - Product list with recommended quantities
   - Unit cost and total cost per product
   - Expected revenue and profit
   - Priority scores and reasoning
   - Days of stock coverage

4. **Shopping List Modal**:
   - Complete shopping list based on recommendations
   - Summary calculations (total items, total cost)
   - Budget and remaining budget display
   - AI insights and notes
   - PDF export functionality

5. **Forecast Visualization**:
   - Demand forecast chart
   - Trend indicators
   - Confidence intervals

### Technical Implementation

#### Frontend Component

**File**: `bva-frontend/src/pages/RestockPlanner.tsx`

**Key Hooks Used**:
- `useAuth()`: Get current user and shop
- `useIntegration()`: Check integration status
- `useRestock()`: Generate restock strategy
- `useRealtimeDashboard()`: Real-time updates

**Data Fetching**:
```typescript
const restockMutation = useRestock();
const restockData = restockMutation.data;

const handleGeneratePlan = async () => {
  restockMutation.mutate({
    shopId,
    budget: parseFloat(budget),
    goal,
    restockDays: parseInt(restockDays),
  });
};
```

**Shopping List Modal**:
```typescript
const handleApprove = () => {
  setIsShoppingListOpen(true);
};

const handleExportPDF = async () => {
  const canvas = await html2canvas(pdfContentRef.current);
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF();
  pdf.addImage(imgData, 'PNG', 0, 0);
  pdf.save('restock-shopping-list.pdf');
};
```

#### Backend Service

**File**: `server/src/service/restock.service.ts`

**Function**: `calculateRestockStrategy(dto: RestockRequestDTO)`

**Process**:
1. Check for active Shopee-Clone integration
2. Fetch products with inventory (only synced products)
3. Fetch sales history (last 60 days)
4. Calculate `avg_daily_sales` per product
5. Calculate `profit_margin` per product: `(price - cost) / price`
6. Transform to ML service format: `MLProductInput[]`
7. Call ML service: `POST /api/v1/restock/strategy`
8. Transform response to frontend format
9. Return recommendations

**API Endpoint**: `POST /api/ai/restock-strategy`

**Request Body**:
```json
{
  "shopId": "SHOP-001",
  "budget": 5000.0,
  "goal": "profit",
  "restockDays": 14
}
```

**ML Service Request**:
```json
{
  "shop_id": "SHOP-001",
  "budget": 5000.0,
  "goal": "profit",
  "restock_days": 14,
  "products": [
    {
      "product_id": "PROD-001",
      "name": "UFC Banana Catsup",
      "price": 18.0,
      "cost": 12.0,
      "stock": 5,
      "category": "Condiments",
      "avg_daily_sales": 12.0,
      "profit_margin": 0.33,
      "min_order_qty": 1
    }
  ]
}
```

**ML Service Response**:
```json
{
  "strategy": "profit",
  "shop_id": "SHOP-001",
  "budget": 5000.0,
  "items": [
    {
      "product_id": "PROD-001",
      "name": "UFC Banana Catsup",
      "qty": 163,
      "unit_cost": 12.0,
      "total_cost": 1956.0,
      "expected_profit": 978.0,
      "expected_revenue": 2934.0,
      "days_of_stock": 13.6,
      "priority_score": 108.0,
      "reasoning": "High profit margin (33.3%), 12.0 units/day, urgency: 3.0x"
    }
  ],
  "totals": {
    "total_items": 1,
    "total_qty": 163,
    "total_cost": 1956.0,
    "budget_used_pct": 39.12,
    "expected_revenue": 2934.0,
    "expected_profit": 978.0,
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

### ML Service Integration

**ML Service Endpoint**: `POST /api/v1/restock/strategy`

**Algorithms**:

1. **Profit Maximization** (Greedy):
   - Priority Score = `profit_margin × avg_daily_sales × urgency_factor`
   - Urgency Factor = `max(1.0, (restock_days × avg_daily_sales) / current_stock)`
   - Sort by priority score (descending)
   - Select products that fit within budget

2. **Volume Maximization** (Greedy):
   - Volume Score = `avg_daily_sales × (1 - current_stock_coverage)`
   - Sort by volume score (descending)
   - Select products that maximize turnover

3. **Balanced Strategy**:
   - Run both profit and volume maximization
   - Weight each result: 50% profit + 50% volume
   - Merge recommendations

**Time Complexity**: O(n log n) due to sorting

### Integration Requirements

**Data Isolation**:
- Only considers products with `externalId` (synced from Shopee-Clone)
- Requires active integration with terms accepted
- Disables "Generate Restock Plan" button if not connected

**Data Requirements**:
- Products must have `price > cost` (positive profit margin)
- At least 7-14 days of sales history for accurate `avg_daily_sales`
- Products with invalid data are automatically filtered out

### User Flow

1. User navigates to Restock Planner page
2. System checks for active integration
3. If connected:
   - User enters budget, goal, and restock days
   - Clicks "Generate Restock Plan"
   - Backend fetches products and sales data
   - ML service calculates optimal strategy
   - Recommendations displayed with charts
   - User clicks "Approve" to view shopping list
   - Shopping list modal opens with details
   - User can export shopping list as PDF
4. If not connected:
   - Shows "Integration Required" message
   - Disables "Generate Restock Plan" button
   - Guides user to Settings page

### PDF Export

- Uses `jspdf` and `html2canvas` libraries
- Generates plain white document
- Includes shopping list, quantities, costs, and summary
- Downloadable as `restock-shopping-list.pdf`

---

## MarketMate

**Assigned to: CODI**

### Overview

MarketMate is an AI-powered marketing automation feature that generates professional ad content, manages campaigns, and provides promotion recommendations. It uses Google Gemini AI to create compelling marketing copy and images.

### Key Features

1. **AI Ad Generation**:
   - Ad copy generation using Google Gemini 2.0 Flash
   - Ad image generation using Gemini Imagen
   - Multiple playbook types (Flash Sale, New Arrival, Best Seller, Bundle)
   - Hashtag generation

2. **Promotion Recommendations**:
   - Near-expiry product promotions
   - Event-based promotions (holidays, seasons)
   - Discount optimization
   - Marketing copy generation

3. **Campaign Management**:
   - Create campaigns from promotions
   - Schedule campaigns for future dates
   - Publish campaigns immediately
   - Draft, scheduled, and published statuses

4. **Campaign Preview**:
   - Preview ad copy and images
   - Edit before publishing
   - Test different playbooks

### Technical Implementation

#### Frontend Component

**File**: `bva-frontend/src/pages/MarketMate.tsx`

**Key Hooks Used**:
- `usePromotions()`: Fetch promotion recommendations
- `useCampaigns()`: Fetch user campaigns
- `useCreateCampaign()`: Create new campaign
- `useScheduleCampaign()`: Schedule campaign
- `usePublishCampaign()`: Publish campaign
- `useDeleteCampaign()`: Delete campaign

**Ad Generation**:
```typescript
const handleGenerateAd = async (productName, playbook, discount) => {
  const result = await adService.generateCompleteAd({
    product_name: productName,
    playbook,
    discount,
  });
  // Display ad copy, hashtags, and image
};
```

#### Backend Service

**File**: `server/src/service/ad.service.ts`

**Function**: `generateAdCopy(request: AdRequest)`

**Process**:
1. Forward request to ML service
2. ML service uses Google Gemini API
3. Generate ad copy based on playbook
4. Generate hashtags
5. Generate image (optional)
6. Return complete ad content

**API Endpoint**: `POST /api/v1/ads/generate-ad`

**ML Service Integration**:
- Endpoint: `POST /api/v1/ads/generate`
- Uses Google Gemini 2.0 Flash for text
- Uses Gemini 2.5 Flash Image for images

**Playbook System**:
1. **Flash Sale**: Urgent, time-sensitive promotions
2. **New Arrival**: Product launches and new stock
3. **Best Seller Spotlight**: Social proof and bestsellers
4. **Bundle Up!**: Value bundles and multi-product deals

### ML Service Integration

**ML Service Endpoint**: `POST /api/v1/ads/generate`

**Request**:
```json
{
  "product_name": "UFC Banana Catsup",
  "playbook": "flash_sale",
  "discount": "25%"
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

### Promotion Service

**File**: `server/src/service/ad.service.ts`

**Function**: `getPromotions(shopId: string)`

**Process**:
1. Fetch near-expiry products (expiring in next 60 days)
2. Generate calendar events (holidays, seasons)
3. Call ML service: `POST /api/v1/smart-shelf/promotions`
4. ML service pairs products with events
5. Calculates optimal discounts
6. Generates marketing copy
7. Returns promotion recommendations

**ML Service Endpoint**: `POST /api/v1/smart-shelf/promotions`

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
  ]
}
```

### Integration Requirements

**Google Gemini API**:
- Requires `GEMINI_API_KEY` environment variable
- Configured in ML service `.env` file
- Falls back to placeholder if API unavailable

**Data Requirements**:
- Products with expiry dates for promotions
- Product names and descriptions for ad generation
- Optional: Product images for context

### User Flow

1. User navigates to MarketMate page
2. System fetches promotion recommendations
3. User can:
   - View promotion recommendations
   - Generate ad for any product
   - Create campaign from promotion
   - Schedule or publish campaigns
4. Ad Generation:
   - User selects product and playbook
   - Optionally adds discount
   - Clicks "Generate Ad"
   - AI generates ad copy, hashtags, and image
   - User can preview and edit
   - User can create campaign from ad

### Campaign Statuses

- **Draft**: Created but not published
- **Scheduled**: Set to publish at future date
- **Published**: Live and active

---

## Reports

**Assigned to: BOLITO**

### Overview

Reports provides comprehensive business analytics and exportable reports. It offers multiple report types with date range filtering and PDF export capabilities.

### Key Features

1. **Report Types**:
   - Sales Over Time: Revenue trends by date range
   - Profit Analysis: Profit margins and trends
   - Stock Turnover: Inventory turnover rates
   - Platform Comparison: Performance across platforms

2. **Date Range Filtering**:
   - 7 days
   - 30 days
   - 90 days
   - 1 year
   - Custom range

3. **Visualizations**:
   - Bar charts for comparisons
   - Line charts for trends
   - Pie charts for distributions

4. **PDF Export**:
   - Export any report as PDF
   - White background for printing
   - Includes charts and data tables

5. **Metrics Display**:
   - Total revenue
   - Total profit
   - Total sales
   - Average order value
   - Platform statistics

### Technical Implementation

#### Frontend Component

**File**: `bva-frontend/src/pages/Reports.tsx`

**Key Hooks Used**:
- `useQuery()`: Fetch report data
- `reportsService`: Service for report generation

**Data Fetching**:
```typescript
const { data: metrics } = useQuery({
  queryKey: ["dashboardMetrics"],
  queryFn: () => reportsService.getMetrics(),
});

const { data: salesChartData } = useQuery({
  queryKey: ["salesChart", dateRange],
  queryFn: () => reportsService.getSalesChart(dateRange),
});
```

**PDF Export**:
```typescript
const handleExportReportPDF = async (reportType) => {
  const canvas = await html2canvas(pdfContentRef.current);
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF();
  pdf.addImage(imgData, 'PNG', 0, 0);
  pdf.save(`${reportType}-report.pdf`);
};
```

#### Backend Service

**File**: `server/src/service/reports.service.ts`

**Functions**:
- `getSalesOverTime()`: Sales trends by date range
- `getProfitAnalysis()`: Profit analysis
- `getStockTurnoverReport()`: Inventory turnover
- `getPlatformComparison()`: Platform performance
- `getDashboardMetrics()`: Overall metrics

**API Endpoints**:
- `GET /api/reports/sales-over-time`
- `GET /api/reports/profit-analysis`
- `GET /api/reports/stock-turnover`
- `GET /api/reports/platform-comparison`
- `GET /api/reports/metrics`

**Process**:
1. Check for active integration
2. If no integration, return empty data
3. Fetch sales data from PostgreSQL
4. Filter by date range
5. Filter by platform (if integration active)
6. Calculate metrics and trends
7. Return formatted data

### Integration Requirements

**Data Isolation**:
- Only includes sales from integrated platforms
- Requires active integration for meaningful data
- Returns empty data if no integration

**Date Range Handling**:
- Supports multiple predefined ranges
- Custom date range support
- Efficient querying with date indexes

### User Flow

1. User navigates to Reports page
2. System fetches dashboard metrics
3. User selects report type
4. User selects date range
5. System generates report
6. Report displayed with charts and tables
7. User can export report as PDF

### Report Types

1. **Sales Over Time**:
   - Daily/weekly/monthly revenue
   - Trend indicators
   - Comparison with previous period

2. **Profit Analysis**:
   - Profit margins by product
   - Profit trends over time
   - Top profitable products

3. **Stock Turnover**:
   - Inventory turnover rates
   - Slow-moving products
   - Fast-moving products

4. **Platform Comparison**:
   - Performance by platform
   - Revenue distribution
   - Sales volume comparison

---

## Settings (API Integration)

**Assigned to: JEFF**

### Overview

Settings allows users to manage their profile, password, and most importantly, integrate with external platforms like Shopee-Clone. It handles the complete integration lifecycle from connection to data synchronization.

### Key Features

1. **Profile Management**:
   - Update first name, last name, email
   - View account information

2. **Password Management**:
   - Change password
   - Password validation

3. **Platform Integration**:
   - Connect to Shopee-Clone
   - Connect to Lazada (future)
   - Connect to TikTok (future)
   - View integration status
   - Sync data manually
   - Disconnect integration

4. **Terms & Conditions**:
   - Integration agreement dialog
   - Terms acceptance required
   - Privacy policy acknowledgment

5. **Integration Status**:
   - Connection status indicators
   - Last sync timestamp
   - Data sync controls

### Technical Implementation

#### Frontend Component

**File**: `bva-frontend/src/pages/Settings.tsx`

**Key Hooks Used**:
- `useAuth()`: Get current user
- `useQuery()`: Fetch integrations
- `useMutation()`: Create/update integrations
- `integrationService`: Service for integration operations

**Integration Flow**:
```typescript
const createIntegrationMutation = useMutation({
  mutationFn: (data) => integrationService.createIntegration(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["integrations"] });
    toast.success("Integration connected successfully!");
  },
});

const handleConnect = (platform) => {
  setSelectedPlatform(platform);
  setShowAgreementDialog(true);
};

const handleAcceptTerms = () => {
  createIntegrationMutation.mutate({
    platform: selectedPlatform,
  });
};
```

#### Backend Service

**File**: `server/src/service/integration.service.ts`

**Functions**:
- `createIntegration()`: Create new integration
- `getShopIntegrations()`: Get all integrations for shop
- `syncIntegration()`: Sync data from platform
- `updateIntegration()`: Update integration settings
- `deleteIntegration()`: Remove integration

**API Endpoints**:
- `POST /api/integrations`: Create integration
- `GET /api/integrations`: Get integrations
- `POST /api/integrations/:id/sync`: Sync data
- `PATCH /api/integrations/:id`: Update integration
- `DELETE /api/integrations/:id`: Delete integration

**Integration Creation Process**:
1. User clicks "Connect" for a platform
2. Integration Agreement Dialog opens
3. User reads and accepts terms
4. Frontend calls `POST /api/integrations`
5. Backend creates integration record:
   ```typescript
   {
     shopId: shopId,
     platform: "SHOPEE",
     settings: {
       connectedAt: new Date().toISOString(),
       termsAccepted: true,
       termsAcceptedAt: new Date().toISOString(),
       isActive: true,
     }
   }
   ```
6. Integration is now active
7. User can sync data

**Data Sync Process**:
1. User clicks "Sync Data" button
2. Frontend calls `POST /api/integrations/:id/sync`
3. Backend validates integration is active
4. Backend calls Shopee-Clone API (if applicable)
5. Products and sales data are synced
6. Data stored in PostgreSQL with `externalId`
7. Cache invalidated
8. Success message displayed

### Integration Agreement Dialog

**Component**: `IntegrationAgreementDialog`

**Features**:
- Terms and conditions display
- Privacy policy link
- Accept/Decline buttons
- Required checkbox for acceptance

**Flow**:
1. User clicks "Connect" → Dialog opens
2. User reads terms
3. User checks "I accept" checkbox
4. User clicks "Accept & Connect"
5. Integration created with `termsAccepted: true`
6. Dialog closes
7. Integration status updated

### Integration Status Indicators

**Connection Status**:
- **Connected** (Green): `isActive: true` and `termsAccepted: true`
- **Not Connected** (Orange): No integration or inactive

**Display Logic**:
```typescript
const isConnected = integration?.settings?.isActive === true && 
                    integration?.settings?.termsAccepted === true;
```

### Data Isolation Enforcement

**Backend Enforcement**:
- All services check `hasActiveIntegration()` before returning data
- Only products with `externalId` are included in queries
- Only sales from integrated platforms are included

**Frontend Enforcement**:
- `useIntegration()` hook checks integration status
- Components show "Integration Required" if not connected
- Features disabled if no active integration

### User Flow

1. User navigates to Settings page
2. User sees integration cards for each platform
3. For Shopee-Clone:
   - If not connected: Shows "Connect" button
   - User clicks "Connect"
   - Agreement dialog opens
   - User accepts terms
   - Integration created
   - Status changes to "Connected" (green)
4. If connected:
   - Shows "Sync Data" button
   - Shows "Disconnect" button
   - Shows last sync timestamp
   - User can sync data manually
   - User can disconnect integration

### Security Considerations

1. **Terms Acceptance**: Required before data sync
2. **Data Isolation**: Data only visible after explicit integration
3. **Token Management**: JWT tokens for authentication
4. **API Key Storage**: Secure storage in database (encrypted)
5. **Webhook Validation**: Validates webhook signatures

### Integration with Shopee-Clone

**SSO Authentication**:
- Users can log in to both platforms with same account
- JWT token shared between platforms
- User role determines access (SELLER vs BUYER)

**Data Synchronization**:
- Products synced with `externalId` prefix (e.g., "SHOPEE-123")
- Sales synced with platform identifier
- Real-time updates via webhooks (future)

**Webhook Support**:
- Product created/updated webhooks
- Order status changed webhooks
- Inventory updated webhooks

---

## Summary

The Business Virtual Assistant (BVA) is a comprehensive platform that addresses the inventory management, restocking, and marketing challenges faced by small and medium-sized businesses. Each feature is designed to work independently while contributing to the overall goal of helping businesses make data-driven decisions.

### Key Integration Points

1. **Data Flow**: Frontend → Backend → Database/ML Service
2. **Authentication**: JWT tokens for secure access
3. **Data Isolation**: Only synced data visible after integration
4. **Real-time Updates**: Socket.io for live data
5. **Caching**: Redis for performance optimization
6. **ML Processing**: Python FastAPI service for AI features

### Team Responsibilities

- **CODI**: Introduction/Overview, MarketMate
- **JULS**: Dashboard
- **DAGS**: SmartShelf, Restock Planner
- **BOLITO**: Reports
- **JEFF**: Settings (API Integration)

### Future Enhancements

- Additional platform integrations (Lazada, TikTok)
- Advanced analytics and forecasting
- Automated campaign scheduling
- Mobile app support
- Multi-language support

---

## Appendix: API Reference

### Authentication
- `POST /api/auth/login`: User login
- `POST /api/auth/register`: User registration
- `GET /api/auth/me`: Get current user

### Dashboard
- `GET /api/smart-shelf/:shopId/dashboard`: Get dashboard analytics

### SmartShelf
- `GET /api/smart-shelf/:shopId/at-risk`: Get at-risk inventory

### Restock Planner
- `POST /api/ai/restock-strategy`: Calculate restocking strategy

### MarketMate
- `POST /api/v1/ads/generate-ad`: Generate ad copy
- `POST /api/v1/ads/generate-ad-image`: Generate ad image
- `GET /api/v1/ads/promotions`: Get promotion recommendations

### Reports
- `GET /api/reports/sales-over-time`: Sales trends
- `GET /api/reports/profit-analysis`: Profit analysis
- `GET /api/reports/stock-turnover`: Stock turnover
- `GET /api/reports/platform-comparison`: Platform comparison

### Settings
- `GET /api/integrations`: Get integrations
- `POST /api/integrations`: Create integration
- `POST /api/integrations/:id/sync`: Sync data
- `DELETE /api/integrations/:id`: Delete integration

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Maintained by**: BVA Development Team

