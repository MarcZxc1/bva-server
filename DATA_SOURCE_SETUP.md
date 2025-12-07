# Data Source Setup - Shopee-Clone as Primary Source

## Overview
The database has been cleared and **Shopee-Clone** is now configured as the primary source of data for the BVA system. All products, orders, and sales data will flow from Shopee-Clone to BVA Server, which then powers the BVA Frontend analytics and AI features.

## Data Flow Architecture

```
Shopee-Clone (Source)
    ↓
BVA Server (Sync & Process)
    ↓
PostgreSQL Database
    ↓
BVA Frontend (Display & Analytics)
```

## Integration Flow

### 1. Connect Shopee-Clone Integration
- Navigate to **Settings → Integrations** in BVA Frontend
- Click **"Connect"** on Shopee-Clone
- Review and agree to the integration terms
- Click **"Connect Integration"** (uses your authenticated JWT session)

### 2. Sync Data from Shopee-Clone
- After connecting, click **"Sync"** on the Shopee-Clone integration
- This will:
  - Fetch all products from Shopee-Clone
  - Fetch all orders/sales from Shopee-Clone
  - Upsert data into BVA database
  - Apply "time travel" logic to distribute sales across last 30 days (for ML forecasting)

### 3. BVA Features Use Synced Data
Once data is synced, all BVA features will use real data:
- **SmartShelf**: Analyzes at-risk inventory from synced products
- **Restock Planner**: Uses historical sales data for recommendations
- **MarketMate**: Generates ads for real products
- **Reports**: Displays real sales and profit analytics
- **Dashboard**: Shows real-time metrics from synced data

## Authentication

- **No API Keys Required**: Integration uses JWT tokens from authenticated sessions
- **Automatic Authentication**: When you sync, your current session token is used
- **Secure**: All API calls are authenticated via Bearer tokens

## Data Synchronization

### Products Sync
- Fetches from: `GET /api/products` (Shopee-Clone)
- Maps to: BVA Product model
- Fields synced:
  - Name, description, price, cost
  - SKU, category, image URL
  - Stock quantity

### Sales/Orders Sync
- Fetches from: `GET /api/orders/shop/:shopId` (Shopee-Clone)
- Maps to: BVA Sale model
- Features:
  - Time travel: Distributes orders across last 30 days for ML training
  - Profit calculation: Uses actual product costs
  - Platform tracking: Marks as "SHOPEE" platform

## Manual Sync

To manually sync data:
1. Go to **Settings → Integrations**
2. Find your Shopee-Clone integration
3. Click **"Sync"** button
4. Wait for sync to complete (shows product and sales counts)

## Automatic Sync (Future)

Automatic sync can be implemented via:
- Scheduled cron jobs
- Webhook triggers from Shopee-Clone
- Real-time updates via WebSocket

## Database Status

✅ **Database Cleared**: All previous seed data has been removed
✅ **Ready for Sync**: Database is ready to receive data from Shopee-Clone
✅ **Integration Ready**: JWT-based authentication configured

## Next Steps

1. **Create a user account** in Shopee-Clone (if not exists)
2. **Create products** in Shopee-Clone
3. **Create orders** in Shopee-Clone (as a buyer)
4. **Connect integration** in BVA Frontend
5. **Sync data** from Shopee-Clone
6. **View analytics** in BVA Dashboard, Reports, SmartShelf, etc.

## Troubleshooting

### No data after sync?
- Check that Shopee-Clone has products/orders
- Verify you're logged in with the correct account
- Check server logs for sync errors

### Sync fails?
- Ensure Shopee-Clone server is running on port 3000
- Verify JWT token is valid
- Check network connectivity between services

### Integration not connecting?
- Ensure you're logged into BVA Frontend
- Check that Shopee-Clone is accessible
- Verify CORS settings allow BVA Frontend origin

