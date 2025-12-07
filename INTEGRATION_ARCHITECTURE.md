# BVA Full-Stack Integration Architecture

## Overview

This document describes the complete data flow and integration architecture between **Shopee-Clone**, **BVA Server**, and **BVA Frontend**, with Redis caching for optimized performance.

## Architecture Flow

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Shopee-Clone   │────────▶│   BVA Server     │────────▶│  BVA Frontend   │
│   (Port 5173)   │ Webhook │   (Port 3000)    │  API    │   (Port 8080)   │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                    │
                                    │
                                    ▼
                            ┌──────────────────┐
                            │   Redis Cache    │
                            │   (Port 6379)    │
                            └──────────────────┘
                                    │
                                    │
                                    ▼
                            ┌──────────────────┐
                            │   PostgreSQL    │
                            │   (Port 5432)    │
                            └──────────────────┘
```

## Data Flow

### 1. Shopee-Clone → BVA Server (Webhooks)

When actions occur in Shopee-Clone, webhooks are automatically sent to BVA Server:

#### Product Operations
- **Product Created**: `POST /api/webhooks/products/created`
- **Product Updated**: `POST /api/webhooks/products/updated`
- **Product Deleted**: `POST /api/webhooks/products/deleted`

#### Order Operations
- **Order Created**: `POST /api/webhooks/orders/created`
- **Order Updated**: `POST /api/webhooks/orders/updated`
- **Order Status Changed**: `POST /api/webhooks/orders/status-changed`

#### Inventory Operations
- **Inventory Updated**: `POST /api/webhooks/inventory/updated`

#### Batch Sync
- **Batch Sync**: `POST /api/webhooks/sync/batch` (for initial data sync)

### 2. BVA Server Processing

#### Webhook Handler (`webhook.service.ts`)
- Receives webhook data from Shopee-Clone
- Validates JWT token for authentication
- Upserts data into PostgreSQL database
- Invalidates Redis cache for affected shop
- Emits real-time Socket.IO events

#### Redis Caching Strategy

**Cache Keys:**
- `sales:{shopId}:{startDate}:{endDate}:{interval}` - Sales over time (15 min TTL)
- `profit:{shopId}:{startDate}:{endDate}` - Profit analysis (15 min TTL)
- `platform:{shopId}:{startDate}:{endDate}` - Platform comparison (15 min TTL)
- `dashboard:{shopId}` - Dashboard metrics (10 min TTL)
- `at-risk:{shopId}` - At-risk inventory (5 min TTL)
- `dashboard-analytics:{shopId}` - Dashboard analytics (10 min TTL)

**Cache Invalidation:**
- Automatically invalidated when webhooks are received
- Pattern-based invalidation: `shop:{shopId}:*`
- Ensures data consistency across all cached queries

### 3. BVA Frontend → BVA Server (API)

BVA Frontend fetches data from BVA Server APIs:

#### Reports API
- `GET /api/reports/metrics` - Dashboard metrics (cached)
- `GET /api/reports/sales-summary` - Sales over time (cached)
- `GET /api/reports/profit-analysis` - Profit analysis (cached)
- `GET /api/reports/platform-comparison` - Platform stats (cached)

#### SmartShelf API
- `GET /api/smart-shelf/dashboard/:shopId` - Dashboard analytics (cached)
- `GET /api/smart-shelf/at-risk/:shopId` - At-risk inventory (cached)

#### Real-time Updates
- Socket.IO connection to `shop_{shopId}` room
- Receives `dashboard_update`, `product_update`, `inventory_update` events
- Automatically invalidates React Query cache on updates

## Key Features

### 1. Redis Caching Layer

**Location**: `server/src/lib/redis.ts`

**Features:**
- Centralized Redis client with connection management
- Cache-aside pattern with `getOrSet` method
- Automatic TTL management
- Pattern-based cache invalidation
- Graceful error handling (falls back to DB if Redis fails)

**Usage Example:**
```typescript
const data = await CacheService.getOrSet(
  `cache-key:${shopId}`,
  async () => {
    // Fetch from database
    return await prisma.sale.findMany({ where: { shopId } });
  },
  900 // 15 minutes TTL
);
```

### 2. Webhook Integration

**Shopee-Clone Service**: `shopee-clone/src/services/webhook.service.ts`

**Features:**
- Automatic webhook dispatch on data changes
- JWT token authentication
- Non-blocking (webhook failures don't break main flow)
- Comprehensive error logging

**Integration Points:**
- `MyProducts.tsx` - Product create/update/delete
- `BuyerCheckout.tsx` - Order creation
- `MyOrders.tsx` - Order status changes

### 3. Real-time Synchronization

**Socket.IO Events:**
- `dashboard_update` - New orders, status changes
- `product_update` - Product changes
- `inventory_update` - Inventory changes

**Frontend Hooks:**
- `useRealtimeDashboard` - BVA Frontend dashboard updates
- `useRealtimeProducts` - Shopee-Clone product updates
- `useRealtimeOrders` - Shopee-Clone order updates

## Performance Optimizations

### 1. Redis Caching
- **Sales Data**: 15-minute cache (frequently accessed, changes slowly)
- **Dashboard Metrics**: 10-minute cache (real-time feel)
- **Inventory Data**: 5-minute cache (needs to be fresh)

### 2. Cache Invalidation
- Automatic invalidation on webhook receipt
- Pattern-based bulk invalidation for shop-wide updates
- Ensures data consistency without manual cache management

### 3. Database Queries
- Optimized Prisma queries with proper indexing
- Batch operations for bulk data sync
- Efficient aggregations for reports

## Integration Setup

### 1. Environment Variables

**BVA Server** (`.env`):
```env
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/virtual_business_assistant
PORT=3000
```

**Shopee-Clone** (`.env`):
```env
VITE_API_URL=http://localhost:3000
VITE_BVA_WEBHOOK_URL=http://localhost:3000/api/webhooks
```

### 2. Redis Setup

Redis is automatically started via Docker Compose:
```bash
docker-compose up redis
```

Or manually:
```bash
redis-server
```

### 3. Testing the Integration

1. **Create a product in Shopee-Clone**
   - Product is saved to Shopee-Clone database
   - Webhook sent to BVA Server
   - BVA Server upserts to PostgreSQL
   - Cache invalidated
   - Real-time event emitted

2. **View in BVA Frontend**
   - BVA Frontend fetches from BVA Server API
   - Data served from Redis cache (if available)
   - Real-time updates via Socket.IO

3. **Create an order in Shopee-Clone**
   - Order saved to Shopee-Clone
   - Webhook sent to BVA Server
   - BVA Server creates Sale record
   - Inventory updated
   - Cache invalidated
   - Dashboard updates in real-time

## Benefits

1. **Real-time Data Sync**: Changes in Shopee-Clone instantly reflect in BVA
2. **Optimized Performance**: Redis caching reduces database load
3. **Scalability**: Cache layer handles high read traffic
4. **Data Consistency**: Automatic cache invalidation ensures accuracy
5. **User Experience**: Fast API responses and real-time updates

## Troubleshooting

### Cache Not Updating
- Check Redis connection: `redis-cli ping`
- Verify cache invalidation on webhook receipt
- Check TTL values (may need adjustment)

### Webhooks Not Sending
- Verify JWT token in Shopee-Clone
- Check network connectivity
- Review webhook service error logs

### Real-time Updates Not Working
- Verify Socket.IO connection
- Check shop room joining: `socket.on('join_shop', shopId)`
- Review CORS configuration

## Future Enhancements

1. **Queue System**: Use BullMQ for webhook processing
2. **Retry Logic**: Automatic retry for failed webhooks
3. **Webhook Signing**: Add HMAC signature verification
4. **Cache Warming**: Pre-populate cache on startup
5. **Metrics**: Add Redis performance monitoring

