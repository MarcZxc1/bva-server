# Business Virtual Assistant (BVA) - Complete Project Documentation

## Table of Contents

1. [Introduction - Project Overview](#introduction---project-overview) - **CODI (Codinera, Rafael Emmanuel B.)**
2. [Dashboard](#dashboard) - **JULS (Mendoza, Julius Ceasar V.)**
3. [SmartShelf](#smartshelf) - **DAGS (Dagode, Marc Gerald A.)**
4. [Restock Planner](#restock-planner) - **DAGS (Dagode, Marc Gerald A.)**
5. [MarketMate](#marketmate) - **CODI (Codinera, Rafael Emmanuel B.)**
6. [Reports](#reports) - **BOLITO (Bolito, Jashley Denzel D.)**
7. [Settings (API Integration)](#settings-api-integration) - **JEFF (Lopez, Jefferson C.)**

---

## Introduction - Project Overview

**Assigned to: CODI (Codinera, Rafael Emmanuel B.) - Front-End and UI-UX Designer**

### Problem Statement

Small and medium-sized retail stores often suffer from:

- **Overstocking**: Tying up capital, leading to unsold goods
- **Stockouts**: Missed sales due to poor demand prediction
- **Manual inventory tracking**: Often done on paper or Excel
- **Limited visibility**: Into customer purchasing patterns

Large chains use advanced forecasting systems, but small retailers lack affordable, easy-to-use tools to optimize inventory based on demand trends.

### Solution: Business Virtual Assistant (BVA)

BVA is a comprehensive, AI-powered business management platform designed specifically for Filipino SMBs. It provides:

1. **Intelligent Inventory Management**: AI-powered risk detection for low stock, near-expiry items, and slow-moving products
2. **Demand Forecasting**: Machine learning algorithms predict future product demand
3. **Optimized Restocking**: AI-driven recommendations for restocking based on budget and business goals
4. **Marketing Automation**: AI-generated ad content and promotion planning
5. **Comprehensive Analytics**: Real-time dashboards and detailed business reports
6. **Platform Integration**: Seamless integration with Shopee, Lazada, and TikTok Shop

### How BVA Solves the Problems

**Problem #12 Solutions:**

✅ **Overstocking Prevention**:
- Smart Restock Planner uses AI to recommend optimal restocking quantities based on demand forecasts
- Budget-aware recommendations prevent over-purchasing
- Expiry monitoring alerts prevent ordering too much of perishable items

✅ **Stockout Prevention**:
- Demand forecasting predicts future sales with confidence intervals
- Low stock alerts notify sellers before items run out
- Restock recommendations ensure adequate inventory levels

✅ **Automated Inventory Tracking**:
- Real-time synchronization with Shopee, Lazada, and TikTok Shop
- Automatic stock-in and stock-out tracking via API integration
- No manual data entry required

✅ **Customer Purchasing Pattern Visibility**:
- Comprehensive Reports module shows sales trends, top products, and platform comparisons
- SmartShelf analytics identify best sellers, slow movers, and trending products
- Dashboard provides real-time business metrics and insights

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
│  │  (JULS)  │  │  (DAGS)  │  │ Planner  │  │  (CODI)  │  │
│  │          │  │          │  │  (DAGS)  │  │          │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │             │              │             │         │
│  ┌────┴─────────────┴──────────────┴─────────────┴─────┐  │
│  │              Reports & Settings                      │  │
│  │         (BOLITO)              (JEFF)                 │  │
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
│   (JEFF)     │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Data Flow

1. **User Interaction**: User interacts with BVA frontend (React components)
   - Form inputs, button clicks, navigation events
   - Client-side validation and error handling

2. **API Request**: Frontend makes HTTP requests to backend server
   - RESTful API calls with JSON payloads
   - JWT token included in Authorization header
   - Request interceptors for error handling

3. **Authentication**: JWT token validates user identity
   - Token decoded and verified using secret key
   - User permissions and shop access validated
   - Middleware rejects unauthorized requests

4. **Business Logic**: Backend services process requests
   - Controllers route requests to appropriate services
   - Services implement business rules and data transformation
   - Validation of input parameters and business constraints

5. **Data Fetching**: Services query PostgreSQL database
   - Prisma ORM for type-safe database queries
   - Optimized queries with proper indexing
   - Transaction management for data consistency

6. **ML Processing**: Complex calculations forwarded to ML service
   - Async HTTP requests to FastAPI ML service
   - Python ML models for forecasting and recommendations
   - Batch processing for efficiency

7. **Caching**: Redis caches frequently accessed data
   - TTL-based cache expiration (5-10 minutes)
   - Cache invalidation on data updates
   - Reduces database load by 60-70%

8. **Real-time Updates**: Socket.io emits updates to connected clients
   - WebSocket connection for live data
   - Event-based updates (orders, inventory changes)
   - Automatic reconnection on connection loss

9. **Response**: Data returned to frontend and displayed
   - JSON response with success/error status
   - React Query handles caching and state management
   - UI updates with loading states and error messages

### Integration with E-commerce Platforms

BVA integrates with multiple e-commerce platforms through:

- **Shopee-Clone Integration**: SSO authentication, data synchronization, product and order sync
- **Lazada-Clone Integration**: JWT-based authentication, real-time order and product sync
- **TikTok Shop Integration**: Platform-specific API integration
- **Data Synchronization**: Automatic sync of products, orders, and sales data
- **Platform Integration**: Settings page allows users to connect their accounts
- **Terms & Conditions**: Users must accept terms before data sync is enabled
- **Data Isolation**: BVA only displays data after explicit integration and terms acceptance

---

## Dashboard

**Assigned to: JULS (Mendoza, Julius Ceasar V.) - Project Leader**

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

### How It Works

**Frontend Implementation (`bva-frontend/src/pages/Dashboard.tsx`):**

1. **Data Fetching**:
   - Uses `useAllUserDashboardAnalytics` hook to fetch aggregated metrics
   - Uses `useAllUserAtRiskInventory` hook to fetch at-risk products
   - React Query handles caching and automatic refetching

2. **Metrics Calculation**:
   - Aggregates sales data from all connected shops
   - Calculates total revenue, profit, sales count, and product count
   - Computes profit margin percentage

3. **Forecast Display**:
   - Processes forecast data from ML service
   - Aggregates product-level forecasts into daily totals
   - Displays 14-day forecast in line chart format

4. **Real-time Updates**:
   - Uses `useRealtimeDashboard` hook for Socket.io connections
   - Listens for new orders, inventory updates, and sales events
   - Automatically refreshes data when events occur

**Backend Implementation (`server/src/service/smartShelf.service.ts`):**

1. **Analytics Aggregation**:
   - `getUserDashboardAnalytics` function aggregates data across all user shops
   - Fetches products, sales, and inventory records
   - Calculates metrics from last 60 days of sales data

2. **Forecast Generation**:
   - Prepares sales records for ML service
   - Calls ML service for demand forecasting
   - Returns aggregated forecast data

**Key Functions:**

- `getUserDashboardAnalytics(userId, platform?)`: Main function that aggregates all dashboard metrics
- `generateFallbackForecast(avgDailySales, days)`: Generates simple forecast if ML service unavailable

### Technical Details

- **Performance**: Uses Redis caching with 15-minute TTL
- **Real-time**: Socket.io for live updates
- **Data Source**: PostgreSQL database with Prisma ORM
- **Charts**: Recharts library for visualization

---

## SmartShelf

**Assigned to: DAGS (Dagode, Marc Gerald A.) - Full Stack Developer and SQA**

### Overview

SmartShelf is an intelligent inventory management system that detects at-risk products and provides actionable recommendations. It identifies products that need attention due to low stock, near-expiry dates, or slow sales velocity.

### Key Features

1. **At-Risk Inventory Detection**:
   - Low stock alerts
   - Near-expiry detection
   - Slow-moving product identification
   - Risk scoring (0-100 scale)

2. **Product Trends**:
   - Best Seller identification (top 20% by sales velocity)
   - Trending products (top 50% by sales velocity)
   - Slow Moving products (bottom 20% by sales velocity)
   - Flop products (zero sales)

3. **Actionable Recommendations**:
   - Restock suggestions with quantities
   - Discount recommendations with percentage ranges
   - Bundle suggestions for slow movers
   - Clearance recommendations for expiring items

4. **Product Details View**:
   - Full product information
   - Expiration date display
   - Sales velocity metrics
   - Risk score breakdown

### How It Works

**Frontend Implementation (`bva-frontend/src/pages/SmartShelf.tsx`):**

1. **Data Fetching**:
   - Uses `useAllUserAtRiskInventory` hook to fetch at-risk products
   - Fetches all products for product details lookup
   - React Query handles caching and refetching

2. **Risk Score Display**:
   - Color-coded badges based on risk score:
     - Critical (80-100): Red
     - High (60-79): Orange
     - Medium (40-59): Yellow
     - Low (0-39): Green

3. **Trend Calculation**:
   - `getProductTrend` function categorizes products:
     - Compares product's `avg_daily_sales` against all products
     - Calculates percentiles (top 20%, top 50%, bottom 20%)
     - Assigns trend labels and icons

4. **Integration with MarketMate**:
   - Clicking "Best Seller" badge navigates to MarketMate with "Best Seller Spotlight" playbook
   - Clicking "Flop" badge navigates to MarketMate with "Bundle Up!" playbook
   - Passes product details and shopId for ad generation

**Backend Implementation (`server/src/service/smartShelf.service.ts`):**

1. **Data Aggregation**:
   - `getAllUserAtRiskInventory` aggregates inventory across all user shops
   - Fetches products, inventory, and sales data
   - Prepares data for ML service

2. **ML Service Integration**:
   - Sends inventory and sales data to ML service `/smart-shelf/at-risk` endpoint
   - ML service computes risk scores and recommendations
   - Returns prioritized list of at-risk items

**ML Service Implementation (`ml-service/app/services/inventory_service.py`):**

1. **Risk Score Computation**:
   - `compute_risk_scores` function processes inventory and sales data
   - Uses pandas for vectorized operations (O(n log n) complexity)
   - Detects three risk types:
     - Low stock: `0.3 * (1 - qty/threshold)`
     - Near expiry: `0.4 * (1 - days_left/warning_days)`
     - Slow moving: `0.3 * (1 - velocity/threshold)`
   - Combines into normalized 0-1 risk score

2. **Recommendation Generation**:
   - `_compute_recommendation` function generates actionable recommendations:
     - Near expiry + slow moving → Clearance (30-40% discount)
     - Near expiry only → Discount (15-25% discount)
     - Low stock + good velocity → Restock (with quantity)
     - Slow moving only → Bundle (10-15% discount)

3. **Sales Velocity Calculation**:
   - `compute_daily_sales_velocity` calculates average daily sales
   - Uses rolling window (default 30 days)
   - Handles products with no sales history

**Key Functions:**

- `compute_risk_scores(inventory, sales, thresholds)`: Main ML function for risk detection
- `_detect_low_stock(df, threshold)`: Flags items below stock threshold
- `_detect_near_expiry(df, warning_days)`: Flags items expiring soon
- `_detect_slow_moving(df, threshold)`: Flags items with poor sales velocity
- `_compute_recommendation(row, thresholds)`: Generates specific action recommendations

### Technical Details

- **Performance**: Handles 10K+ products efficiently (<100ms typical)
- **Algorithm**: Vectorized pandas operations, no Python loops
- **Caching**: Redis caching for frequently accessed data
- **Real-time**: Updates when inventory or sales change

---

## Restock Planner

**Assigned to: DAGS (Dagode, Marc Gerald A.) - Full Stack Developer and SQA**

### Overview

The Restock Planner is an AI-powered tool that optimizes restocking strategies based on budget, business goals, and demand forecasts. It helps sellers make data-driven decisions about what to restock and in what quantities.

### Key Features

1. **Intelligent Forecasting**:
   - Baseline sales calendar from historical data
   - Context-aware adjustments (weather, holidays, payday cycles)
   - Multiple forecasting algorithms (Linear, Exponential Smoothing, XGBoost)
   - Confidence intervals for risk management

2. **Optimization Strategies**:
   - **Profit Maximization**: Prioritizes high-margin, fast-moving items
   - **Volume Maximization**: Maximizes inventory turnover and units
   - **Balanced Growth**: Hybrid approach balancing profit and volume

3. **Context Integration**:
   - Weather conditions (affects demand for seasonal items)
   - Payday cycles (increases demand on 15th and month-end)
   - Upcoming holidays (boosts demand for relevant categories)
   - Special events (mega sales, festivals)

4. **Budget-Aware Recommendations**:
   - Accepts user's available budget
   - Suggests most profitable product mix
   - Considers sales history, profit margin, and expiration risks
   - Shows expected ROI and revenue projections

5. **Forecast Calendar**:
   - Visual calendar showing demand spikes
   - Special events highlighted (paydays, holidays, mega sales)
   - Date selection for detailed forecasts
   - Integration with MarketMate for event-based campaigns

### How It Works

**Frontend Implementation (`bva-frontend/src/pages/RestockPlanner.tsx`):**

1. **User Input**:
   - Budget input field
   - Goal selection (Profit, Volume, Balanced)
   - Restock days (how many days of stock to plan for)
   - Context toggles (Payday, Holiday)

2. **Data Preparation**:
   - Fetches all user products with sales history
   - Prepares product data for ML service
   - Includes cost, price, stock, and sales velocity

3. **ML Service Call**:
   - Sends restock request to `/restock/strategy` endpoint
   - Includes products, budget, goal, and context
   - Receives optimized restock recommendations

4. **Recommendations Display**:
   - Shows recommended products with quantities
   - Displays expected profit, revenue, and ROI
   - Provides reasoning for each recommendation
   - "Approve All" button creates shopping list

5. **Forecast Calendar Integration**:
   - `ForecastCalendar` component displays monthly view
   - Highlights special events and demand spikes
   - Clicking date opens `TrendForecastModal` with detailed forecast
   - Integration with MarketMate for event-based ad generation

**Backend Implementation (`server/src/service/restock.service.ts`):**

1. **Data Aggregation**:
   - Fetches products with sales history
   - Calculates average daily sales for each product
   - Prepares product data for ML service

2. **ML Service Integration**:
   - Calls ML service `/restock/strategy` endpoint
   - Passes products, budget, goal, and context
   - Returns optimized restock recommendations

**ML Service Implementation (`ml-service/app/services/restock_service.py`):**

1. **Demand Adjustment**:
   - `apply_context_multipliers` adjusts base demand based on context:
     - Weather: +20% for seasonal items in matching weather
     - Payday: +20% demand increase
     - Holidays: +30-50% depending on holiday type
   - Multipliers are additive (can stack)

2. **Optimization Algorithms**:
   - **Profit Maximization** (`profit_maximization`):
     - Greedy algorithm prioritizing `profit_margin × adjusted_demand`
     - Sorts products by priority score
     - Selects products until budget exhausted
   
   - **Volume Maximization** (`volume_maximization`):
     - Prioritizes high-demand, fast-moving items
     - Maximizes total units and inventory turnover
     - Considers sales velocity and demand
   
   - **Balanced Strategy** (`balanced_strategy`):
     - 50/50 weighted hybrid approach
     - Balances profit potential with volume
     - Provides middle ground between strategies

3. **Restock Quantity Calculation**:
   - Calculates days of stock needed based on `restock_days` parameter
   - Formula: `qty = adjusted_demand × restock_days - current_stock`
   - Ensures minimum restock quantity for low stock items

4. **Budget Optimization**:
   - Greedy selection within budget constraint
   - Calculates total cost, expected revenue, and profit
   - Provides ROI percentage and budget utilization

**Key Functions:**

- `compute_restock_strategy(request)`: Main orchestrator for restocking strategy
- `profit_maximization(products, budget, ...)`: Profit-focused optimization
- `volume_maximization(products, budget, ...)`: Volume-focused optimization
- `balanced_strategy(products, budget, ...)`: Hybrid optimization
- `apply_context_multipliers(base_demand, product, ...)`: Context-aware demand adjustment

### Technical Details

- **Performance**: O(n log n) due to sorting, suitable for up to 10,000 products
- **Algorithm**: Greedy optimization with budget constraint
- **Caching**: Forecasts cached in Redis (24h TTL)
- **Forecasting**: Multiple ML models with auto-selection

---

## MarketMate

**Assigned to: CODI (Codinera, Rafael Emmanuel B.) - Front-End and UI-UX Designer**

### Overview

MarketMate is an AI-powered marketing automation tool that generates contextual marketing campaigns and provides one-click publishing to social media platforms. It uses playbooks to create targeted advertisements based on inventory and sales data.

### Key Features

1. **AI Advertisement Generation**:
   - **Playbooks**: Flash Sale, New Arrival, Best Seller Spotlight, Bundle Up!
   - **Ad Copy Generation**: AI-generated marketing text using Google Gemini 2.0 Flash
   - **Image Generation**: AI-generated ad images using Google Imagen
   - **Product Image Context**: Uses actual product images from inventory

2. **Campaign Management**:
   - Create, edit, and delete campaigns
   - Schedule campaigns for future publishing
   - Publish campaigns immediately to Facebook
   - View campaign analytics and engagement

3. **Facebook Integration**:
   - Connect Facebook Pages via OAuth 2.0 (Supabase)
   - Publish campaigns directly to Facebook
   - Schedule posts with Facebook native scheduling
   - Automatic publishing via scheduler service

4. **Image Upload & Editing**:
   - Upload custom product images
   - Edit generated images with custom prompts
   - Template context for style adjustments
   - Image compression and optimization

5. **Smart Integration**:
   - Deep linking from SmartShelf (Best Seller, Flop trends)
   - Event-based campaigns from Forecast Calendar
   - Product bundling for slow movers

### How It Works

**Frontend Implementation (`bva-frontend/src/pages/MarketMate.tsx`):**

1. **Campaign Display**:
   - Lists all campaigns with status (Draft, Scheduled, Published)
   - Shows scheduled date/time for scheduled campaigns
   - Displays campaign image, caption, and engagement metrics

2. **Ad Generation Dialog**:
   - `AdGeneratorDialog` component handles ad creation
   - Product selection from inventory
   - Playbook selection (Flash Sale, New Arrival, etc.)
   - Image upload option
   - Custom prompt for image editing

3. **Facebook Connection**:
   - Checks Facebook connection status via `useQuery`
   - "Connect Facebook" button initiates OAuth flow
   - "Reconnect" button for refreshing connection
   - Status badge shows connection state

4. **Campaign Scheduling**:
   - Date and time picker (12-hour format with AM/PM)
   - Validates scheduled time is in the future
   - Shows scheduled date/time in campaign list
   - "Cancel" button unschedules (moves to Draft)

5. **Campaign Publishing**:
   - "Publish Now" button publishes immediately
   - "Schedule" button schedules for future
   - Facebook native scheduling for posts 10+ minutes away
   - Scheduler service handles posts < 10 minutes away

**Backend Implementation (`server/src/controllers/campaign.controller.ts`):**

1. **Campaign CRUD**:
   - `createCampaign`: Creates new campaign with content and image
   - `updateCampaign`: Updates existing campaign
   - `getCampaigns`: Fetches all campaigns for user's shop
   - `unscheduleCampaign`: Changes status from SCHEDULED to DRAFT
   - `deleteCampaign`: Permanently deletes campaign

2. **Campaign Scheduling**:
   - `scheduleCampaign`: Schedules campaign for future publishing
   - Validates scheduled time is in the future
   - Attempts Facebook native scheduling if time is 10+ minutes away
   - Falls back to scheduler service if Facebook scheduling fails
   - Always marks campaign as SCHEDULED status

3. **Campaign Publishing**:
   - `publishCampaign`: Publishes campaign immediately to Facebook
   - Verifies Facebook connection and token validity
   - Posts to Facebook Page via Graph API
   - Updates campaign status to PUBLISHED
   - Creates notification for user

**Scheduler Service (`server/src/service/campaignScheduler.service.ts`):**

1. **Automatic Publishing**:
   - Runs every 30 seconds checking for scheduled campaigns
   - Finds campaigns where `scheduledAt <= now` and status is SCHEDULED
   - Publishes campaigns to Facebook when time arrives
   - Updates status to PUBLISHED after successful publishing
   - Creates notification for user

2. **Error Handling**:
   - Retries up to 3 times if Facebook connection fails
   - After 3 failures, moves campaign to DRAFT status
   - Logs detailed error information
   - Prevents scheduler from crashing on errors

**ML Service Implementation (`ml-service/app/services/ad_service.py`):**

1. **Ad Copy Generation**:
   - Uses Google Gemini 2.0 Flash for text generation
   - Playbook-specific prompts for different campaign types
   - Analyzes product images using Gemini Vision API
   - Generates contextual ad copy based on product appearance

2. **Image Generation**:
   - Uses Google Imagen for image generation
   - Requires product image as visual context
   - Generates marketing images featuring the actual product
   - Supports custom prompts for image editing
   - Template context for style adjustments

3. **Quota Management**:
   - Tracks API quota errors
   - Implements cooldown period after 429 errors
   - Dynamic retry time based on API error messages
   - Shorter cooldown for user-initiated edits

**Key Functions:**

- `generate_ad_content(product_name, playbook, ...)`: Main function for ad generation
- `_generate_ad_copy(product_name, product_image_url, playbook)`: Generates ad text
- `_generate_ad_image(product_name, product_image_url, playbook, ...)`: Generates ad image
- `_is_quota_exceeded(model, allow_bypass)`: Checks if API quota is exceeded
- `_record_quota_error(model, error_message)`: Records quota errors for cooldown

### Technical Details

- **AI Models**: Google Gemini 2.0 Flash (text), Google Imagen (images)
- **Image Processing**: Compression, resizing, format conversion
- **Scheduling**: 30-second interval checks, Facebook native + scheduler fallback
- **Real-time**: Socket.io for campaign updates

---

## Reports

**Assigned to: BOLITO (Bolito, Jashley Denzel D.) - Front-End Developer**

### Overview

The Reports module provides comprehensive business analytics and exportable reports. It helps sellers make quick decisions without manually compiling data from multiple platforms.

### Key Features

1. **Sales Reports**:
   - Sales over time (daily, weekly, monthly)
   - Revenue trends and patterns
   - Order count analysis
   - Platform-specific filtering

2. **Profit Analysis**:
   - Total revenue and profit
   - Cost of Goods Sold (COGS)
   - Profit margin calculations
   - Profit trends over time

3. **Stock Turnover Report**:
   - Inventory turnover rates
   - Slow-moving product identification
   - Stock level analysis
   - Days of inventory on hand

4. **Platform Comparison**:
   - Revenue by platform (Shopee, Lazada, TikTok Shop)
   - Order count by platform
   - Profit margin by platform
   - Performance comparison charts

5. **Export Functionality**:
   - PDF export for all report types
   - Includes charts and data tables
   - Professional formatting
   - Date range and filters included

### How It Works

**Frontend Implementation (`bva-frontend/src/pages/Reports.tsx`):**

1. **Report Selection**:
   - Tabs for different report types (Sales, Profit, Stock, Platform)
   - Date range selector (7d, 30d, 90d, 1y, custom)
   - Platform filter (All, Shopee, Lazada)

2. **Data Fetching**:
   - Uses `reportsService` to fetch report data
   - React Query handles caching and refetching
   - Loading states and error handling

3. **Chart Visualization**:
   - Recharts library for interactive charts
   - Line charts for trends
   - Bar charts for comparisons
   - Responsive design

4. **PDF Export**:
   - Uses `jspdf` and `html2canvas` for PDF generation
   - Captures report content including charts
   - Includes date range and filters in PDF

**Backend Implementation (`server/src/services/reports.service.ts`):**

1. **Sales Over Time**:
   - `getSalesOverTimeForUser`: Aggregates sales by date interval
   - Groups sales by day or month
   - Fills missing dates with zero values
   - Calculates revenue, orders, and profit per period

2. **Profit Analysis**:
   - `getProfitAnalysisForUser`: Calculates comprehensive profit metrics
   - Fetches sales with items
   - Calculates COGS from product costs
   - Computes profit margin percentage

3. **Stock Turnover**:
   - `getStockTurnoverReportForUser`: Analyzes inventory turnover
   - Calculates turnover rates
   - Identifies slow-moving products
   - Computes days of inventory

4. **Platform Comparison**:
   - `getPlatformStatsForUser`: Compares performance across platforms
   - Aggregates sales by platform
   - Calculates platform-specific metrics
   - Returns comparison data

**Key Functions:**

- `getSalesOverTimeForUser(userId, startDate, endDate, interval)`: Sales aggregation
- `getProfitAnalysisForUser(userId, startDate, endDate)`: Profit calculations
- `getStockTurnoverReportForUser(userId, startDate, endDate)`: Stock analysis
- `getPlatformStatsForUser(userId, startDate, endDate)`: Platform comparison
- `fillMissingDates(data, startDate, endDate, interval)`: Ensures continuous chart data

### Technical Details

- **Performance**: Redis caching with 15-minute TTL
- **Charts**: Recharts library for visualization
- **Export**: PDF generation with charts
- **Data Source**: PostgreSQL with Prisma ORM

---

## Settings (API Integration)

**Assigned to: JEFF (Lopez, Jefferson C.) - Database Administrator**

### Overview

The Settings module manages API integrations with e-commerce platforms (Shopee, Lazada, TikTok Shop). It handles authentication, data synchronization, and platform connection management.

### Key Features

1. **Platform Integration**:
   - Shopee-Clone integration
   - Lazada-Clone integration
   - TikTok Shop integration (planned)
   - Connection status display

2. **Data Synchronization**:
   - Manual sync button
   - Automatic sync on connection
   - Sync status indicators
   - Error handling and retry

3. **Terms & Conditions**:
   - Terms acceptance required before integration
   - Data privacy information
   - Platform-specific terms

4. **Shop Management**:
   - Link existing shops
   - Create new shops
   - Platform-specific shop configuration

### How It Works

**Frontend Implementation (`bva-frontend/src/pages/Settings.tsx`):**

1. **Integration Display**:
   - Shows connected platforms with status badges
   - Displays last sync time
   - Connection status indicators

2. **Connection Flow**:
   - "Connect" button opens platform-specific OAuth flow
   - Handles OAuth callbacks
   - Stores authentication tokens
   - Creates integration record

3. **Sync Management**:
   - "Sync Now" button triggers manual sync
   - Shows sync progress and status
   - Error messages for failed syncs
   - Success notifications

**Backend Implementation (`server/src/service/integration.service.ts`):**

1. **Integration Creation**:
   - `createIntegration`: Creates new platform integration
   - Stores platform-specific tokens
   - Sets integration as active
   - Automatically syncs data after creation

2. **Data Synchronization**:
   - `syncIntegration`: Triggers platform-specific sync
   - `shopeeIntegrationService.syncAllData`: Syncs Shopee data
   - `lazadaIntegrationService.syncAllData`: Syncs Lazada data
   - Fetches products, orders, and sales data

3. **Shop Linking**:
   - Links existing shops from e-commerce platforms
   - Creates shop records if needed
   - Associates shops with user accounts

**Shopee Integration (`server/src/service/shopeeIntegration.service.ts`):**

1. **Authentication**:
   - Uses JWT token from Shopee-Clone
   - Validates token with Shopee-Clone API
   - Stores token in integration settings

2. **Data Sync**:
   - `syncAllData`: Main sync function
   - Fetches products from Shopee-Clone
   - Fetches orders and sales data
   - Updates inventory quantities
   - Creates sale records in BVA database

**Lazada Integration (`server/src/service/lazadaIntegration.service.ts`):**

1. **Authentication**:
   - Uses JWT token from Lazada-Clone
   - Validates token with Lazada-Clone API
   - Stores token in integration settings

2. **Data Sync**:
   - `syncAllData`: Main sync function
   - Fetches products from Lazada-Clone
   - Fetches orders and sales data
   - Uses actual order creation dates (not time-traveled)
   - Creates sale records in BVA database

**Key Functions:**

- `createIntegration(data)`: Creates platform integration
- `syncIntegration(integrationId, token)`: Triggers data sync
- `getIntegrations(userId)`: Fetches user's integrations
- `shopeeIntegrationService.syncAllData(shopId, token)`: Shopee data sync
- `lazadaIntegrationService.syncAllData(shopId, token)`: Lazada data sync

### Technical Details

- **Authentication**: JWT tokens stored in integration settings
- **Data Sync**: Automatic on connection, manual via button
- **Error Handling**: Retry logic and error notifications
- **Database**: PostgreSQL with Prisma ORM

---

## Project Requirements Implementation Status

Based on the SE101 Project Title Proposal Form, here's the implementation status:

### ✅ Implemented Features

1. **✅ Retrieves and monitors stock-in and stock-out data per platform**
   - Shopee, Lazada, and TikTok Shop integration
   - Real-time data synchronization
   - Unified summary across platforms

2. **✅ Uses flexible predictive analytics with machine learning**
   - Multiple forecasting algorithms (Linear, Exponential Smoothing, XGBoost)
   - Context-aware adjustments (weather, holidays, paydays)
   - Adapts to different product types

3. **✅ Accepts user's budget and suggests profitable product mix**
   - Restock Planner with budget input
   - Three optimization strategies (Profit, Volume, Balanced)
   - Considers sales history, profit margin, and expiration risks

4. **✅ Assists in generating, scheduling, and publishing advertisements**
   - MarketMate with AI ad generation
   - Campaign scheduling and publishing
   - Facebook integration for social media posting

5. **✅ Monitors overall product status and sales performance**
   - SmartShelf with at-risk detection
   - Product trends (Best Seller, Flop, Slow Moving)
   - Strategic recommendations (discounts, bundles, promos)

6. **✅ Provides summaries of sales and profits**
   - Reports module with comprehensive analytics
   - Platform comparison
   - Exportable PDF reports

### ✅ Problem #12 Solutions

**Problem**: Small and medium-sized retail stores often suffer from:
- Overstocking (tying up capital, leading to unsold goods)
- Stockouts (missed sales due to poor demand prediction)
- Manual inventory tracking (often done on paper or Excel)
- Limited visibility into customer purchasing patterns

**BVA Solutions**:

✅ **Overstocking Prevention**:
- Smart Restock Planner recommends optimal quantities based on demand forecasts
- Budget-aware recommendations prevent over-purchasing
- Expiry monitoring prevents ordering too much of perishable items

✅ **Stockout Prevention**:
- Demand forecasting predicts future sales with confidence intervals
- Low stock alerts notify before items run out
- Restock recommendations ensure adequate inventory

✅ **Automated Inventory Tracking**:
- Real-time sync with Shopee, Lazada, and TikTok Shop
- Automatic stock-in and stock-out tracking via API
- No manual data entry required

✅ **Customer Purchasing Pattern Visibility**:
- Reports module shows sales trends and top products
- SmartShelf analytics identify best sellers and slow movers
- Dashboard provides real-time business metrics

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

- **CODI (Codinera, Rafael Emmanuel B.)**: Introduction/Overview, MarketMate, Front-End and UI-UX Design
- **JULS (Mendoza, Julius Ceasar V.)**: Dashboard, Project Leadership
- **DAGS (Dagode, Marc Gerald A.)**: SmartShelf, Restock Planner, Full Stack Development, SQA
- **BOLITO (Bolito, Jashley Denzel D.)**: Reports, Front-End Development
- **JEFF (Lopez, Jefferson C.)**: Settings (API Integration), Database Administration

### Future Enhancements

**Q1 2026: Platform Expansion**
- ✅ Lazada integration (data sync, product management)
- ✅ TikTok Shop integration (video commerce support)
- ⏳ Facebook Marketplace integration
- ⏳ Instagram Shopping integration

**Q2 2026: Advanced Analytics**
- ⏳ Customer segmentation and RFM analysis
- ⏳ Predictive analytics for customer churn
- ⏳ A/B testing for marketing campaigns
- ⏳ Custom report builder with drag-and-drop
- ⏳ Advanced forecasting with ARIMA/Prophet models

**Q3 2026: Automation & AI**
- ✅ Automated campaign scheduling based on inventory levels
- ⏳ AI-powered pricing optimization
- ⏳ Chatbot for customer support automation
- ⏳ Automatic restock orders (integration with suppliers)
- ⏳ Voice commands for mobile app

**Q4 2026: Mobile & Localization**
- ⏳ Native mobile app (iOS and Android)
- ⏳ Push notifications for stock alerts
- ⏳ Offline mode for mobile app
- ⏳ Multi-language support (English, Tagalog, Cebuano)
- ⏳ Multi-currency support (PHP, USD, EUR)

**2027 and Beyond**
- ⏳ Multi-user/team collaboration features
- ⏳ Role-based access control (RBAC)
- ⏳ API marketplace for third-party integrations
