# BVA Integration Flow Guide

## Overview

This document explains how the Shopee-Clone integration works with BVA to provide real-time analytics, inventory management, and AI-powered features.

## Architecture

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│              │         │              │         │              │
│ Shopee-Clone │────────▶│  BVA Server  │◀────────│ BVA Frontend │
│  (Seller)    │ Webhook │  (Backend)   │   API   │   (User)     │
│              │         │              │         │              │
└──────────────┘         └──────────────┘         └──────────────┘
       │                        │                        │
       │                        │                        │
       │                        ▼                        │
       │                  ┌──────────┐                  │
       │                  │ Database │                  │
       │                  │ (Prisma) │                  │
       │                  └──────────┘                  │
       │                        │                        │
       │                        │                        │
       └────────────────────────┴────────────────────────┘
                          WebSocket
                     (Real-time Updates)
```

## Integration Flow

### 1. **User Initiates Connection (BVA Frontend)**

**Location:** `bva-frontend/src/pages/Settings.tsx`

- User clicks "Connect" button for Shopee integration
- BVA Frontend opens `ShopeeCloneIntegrationModal`
- Modal loads Shopee-Clone in an iframe: `/bva-integration-check`

### 2. **Authentication (Shopee-Clone)**

**Location:** `shopee-clone/src/pages/BVAIntegrationCheck.tsx`

- User logs in with Shopee-Clone seller account
- Shopee-Clone verifies user is a seller with a shop
- Shows permission dialog to grant BVA access
- On permission grant, sends message to parent window with:
  ```typescript
  {
    type: 'SHOPEE_CLONE_AUTH_SUCCESS',
    shop: { id: string, name: string },
    user: { id: string, email: string, name: string },
    token: string // Shopee-Clone JWT token
  }
  ```

### 3. **Integration Creation (BVA Frontend → BVA Server)**

**Location:** `bva-frontend/src/pages/Settings.tsx` → `handleShopeeConnect()`

Steps:
1. **Link Shop** - Creates shop access link in BVA database
   ```typescript
   POST /api/shop-access/link
   Body: { shopId: string }
   ```

2. **Create Integration** - Stores integration settings with token
   ```typescript
   POST /api/integrations
   Body: {
     platform: "SHOPEE",
     shopeeToken: string // Shopee-Clone JWT token
   }
   ```

3. **Initial Sync** - Fetches all products and sales data
   ```typescript
   POST /api/integrations/:id/sync
   ```

### 4. **Data Synchronization (BVA Server → Shopee-Clone)**

**Location:** `server/src/service/shopeeIntegration.service.ts`

**READ-ONLY OPERATION** - BVA only reads from Shopee-Clone:

#### Products Sync
- Fetches products: `GET /api/products/shop/:shopId`
- Maps to BVA database:
  - `product.name` → `Product.name` (for MarketMate, SmartShelf)
  - `product.price` → `Product.price` (for Restock Planner)
  - `product.stock` → `Product.stock` (for SmartShelf)
  - `product.cost` → `Product.cost` (for profit calculation)
  - `product.image` → `Product.imageUrl` (for MarketMate campaigns)
  - `product.id` → `Product.externalId` (links to Shopee-Clone)

#### Sales/Orders Sync
- Fetches orders: `GET /api/orders/seller/:shopId`
- Maps to BVA database:
  - `order.items` → `Sale.items` (for Restock Planner analysis)
  - `order.total` → `Sale.total`, `Sale.revenue` (for Reports, Dashboard)
  - Calculates `Sale.profit` from product costs
  - `order.id` → `Sale.externalId` (links to Shopee-Clone)
  - **Time-travels dates** for ML service historical data (distributes across last 30 days)

### 5. **Real-Time Updates (Shopee-Clone → BVA Server)**

**Location:** `shopee-clone/src/services/webhook.service.ts`

When seller makes changes in Shopee-Clone, webhooks are automatically sent:

#### Product Events
- **Created:** `POST /api/webhooks/products/created`
- **Updated:** `POST /api/webhooks/products/updated`
- **Deleted:** `POST /api/webhooks/products/deleted`

#### Order Events
- **Created:** `POST /api/webhooks/orders/created`
- **Updated:** `POST /api/webhooks/orders/updated`
- **Status Changed:** `POST /api/webhooks/orders/status-changed`

#### Inventory Events
- **Updated:** `POST /api/webhooks/inventory/updated`

**Webhook Payload Structure:**
```typescript
{
  shopId: string,        // From user context
  id: string,            // Product/Order ID
  name: string,
  price: number,
  stock: number,
  // ... other fields
}
```

**Authentication:**
- Uses seller's JWT token: `Authorization: Bearer <token>`
- Token is verified by `webhookMiddleware`
- ShopId is extracted from token or request body

### 6. **Real-Time Broadcasting (BVA Server → BVA Frontend)**

**Location:** `server/src/services/socket.service.ts`

When webhooks are received, BVA Server broadcasts updates via WebSocket:

```typescript
io.to(`shop_${shopId}`).emit("dashboard_update", {
  type: "new_order" | "inventory_update" | "low_stock",
  data: { ... }
});
```

### 7. **Real-Time Data Display (BVA Frontend)**

**Location:** `bva-frontend/src/hooks/useRealtimeDashboard.ts`

BVA Frontend listens for WebSocket events and updates UI:

- **Dashboard** - Real-time sales, revenue, orders
- **SmartShelf** - Real-time inventory levels, low stock alerts
- **Restock Planner** - Updated with latest sales data
- **MarketMate** - Uses latest product catalog
- **Reports** - Real-time analytics

## Data Flow Example

### Example: Seller Creates Product in Shopee-Clone

1. **Shopee-Clone UI** - Seller clicks "Add Product" and fills form
2. **Shopee-Clone API** - `POST /api/products` creates product in Shopee database
3. **Webhook Triggered** - `webhookService.sendProductCreated()` is called
4. **BVA Server Receives** - `POST /api/webhooks/products/created`
5. **Webhook Handler** - `webhookService.handleProductCreated()` saves to BVA database
6. **Cache Invalidated** - `CacheService.invalidateShop(shopId)`
7. **WebSocket Broadcast** - `io.to(shop_${shopId}).emit("product_update")`
8. **BVA Frontend Updates** - `useRealtimeProducts` hook receives update and refreshes UI

## Configuration

### Shopee-Clone Environment Variables

**File:** `shopee-clone/.env`

```bash
# API endpoint (same as BVA Server)
VITE_API_URL=http://localhost:3000/api

# Webhook endpoint for sending updates to BVA
VITE_BVA_WEBHOOK_URL=http://localhost:3000/api/webhooks
```

### BVA Frontend Environment Variables

**File:** `bva-frontend/.env`

```bash
# BVA Server API endpoint
VITE_API_URL=http://localhost:3000

# Shopee-Clone URL for integration iframe
VITE_SHOPEE_CLONE_URL=http://localhost:5173
```

### BVA Server Environment Variables

**File:** `server/.env`

```bash
# Database connection
DATABASE_URL=postgresql://...

# JWT Secret (must match across all services)
JWT_SECRET=your_secret_key

# Shopee-Clone API URL (for fetching data)
SHOPEE_CLONE_API_URL=http://localhost:3000
```

## API Endpoints Summary

### BVA Server (Port 3000)

#### Integration Endpoints
- `POST /api/integrations` - Create integration
- `GET /api/integrations` - Get user's integrations
- `POST /api/integrations/:id/sync` - Sync data from platform
- `POST /api/integrations/:id/test` - Test connection

#### Webhook Endpoints
- `POST /api/webhooks/products/created` - Product created webhook
- `POST /api/webhooks/products/updated` - Product updated webhook
- `POST /api/webhooks/products/deleted` - Product deleted webhook
- `POST /api/webhooks/orders/created` - Order created webhook
- `POST /api/webhooks/orders/updated` - Order updated webhook
- `POST /api/webhooks/inventory/updated` - Inventory updated webhook

#### Shop Access Endpoints
- `POST /api/shop-access/link` - Link external shop to user account
- `GET /api/shop-access/linked-shops` - Get user's linked shops

### Shopee-Clone (Port 5173)

#### Product Endpoints
- `GET /api/products` - Get all products
- `GET /api/products/shop/:shopId` - Get shop's products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

#### Order Endpoints
- `GET /api/orders/seller/:shopId` - Get shop's orders
- `POST /api/orders` - Create order
- `PATCH /api/orders/:id/status` - Update order status

#### Integration Endpoint
- `GET /bva-integration-check` - Integration authentication page

## Features Enabled by Integration

### 1. **Dashboard (Real-time)**
- Total revenue, profit, orders
- Sales trends and charts
- Low stock alerts
- WebSocket updates

### 2. **SmartShelf**
- At-risk inventory detection
- Stock level monitoring
- Reorder recommendations
- Real-time inventory updates

### 3. **Restock Planner**
- AI-powered forecasting
- Optimal restock quantities
- Profit optimization
- Historical sales analysis

### 4. **MarketMate (AI Ad Generation)**
- Uses product catalog for campaigns
- Product images for creatives
- Category-based targeting
- Multi-channel ad creation

### 5. **Reports**
- Sales analytics
- Product performance
- Revenue trends
- Profit margins

## Troubleshooting

### Integration Not Syncing

**Check:**
1. Shopee-Clone `.env` has correct `VITE_BVA_WEBHOOK_URL`
2. User is logged into Shopee-Clone as a seller
3. User has granted permission to BVA
4. Integration status is active in Settings
5. Server logs for webhook errors

### Webhooks Not Received

**Check:**
1. `VITE_BVA_WEBHOOK_URL` points to BVA Server
2. JWT token is valid and not expired
3. Webhook middleware is authenticating correctly
4. Server is running and accessible
5. Firewall not blocking webhook requests

### Data Not Appearing in BVA

**Check:**
1. Initial sync completed successfully
2. Products/orders exist in Shopee-Clone
3. ShopId is correct in database
4. Check server logs for sync errors
5. Manually trigger sync from Settings

### Real-time Updates Not Working

**Check:**
1. WebSocket connection established
2. User joined correct shop room
3. Browser allows WebSocket connections
4. Server WebSocket is configured correctly
5. Check browser console for errors

## Security Considerations

1. **JWT Token Security**
   - Tokens are stored securely in localStorage
   - Tokens expire after 7 days
   - Tokens are validated on every request

2. **Webhook Authentication**
   - All webhooks require valid JWT token
   - ShopId is validated against user's shops
   - Rate limiting prevents abuse

3. **Data Access Control**
   - Users can only access their own shops
   - Shop access requires explicit linking
   - Integration can be disconnected anytime

4. **Read-Only Integration**
   - BVA only reads from Shopee-Clone
   - No write operations to Shopee-Clone
   - Seller maintains full control in Shopee-Clone

## Development Notes

### Testing Integration

1. **Start All Services:**
   ```bash
   # Terminal 1 - BVA Server
   cd server && npm run dev

   # Terminal 2 - BVA Frontend
   cd bva-frontend && npm run dev

   # Terminal 3 - Shopee-Clone
   cd shopee-clone && npm run dev
   ```

2. **Test Flow:**
   - Register seller account in Shopee-Clone
   - Create products in Shopee-Clone
   - Open BVA Frontend
   - Go to Settings → Integrations
   - Connect Shopee-Clone integration
   - Verify products appear in BVA
   - Create order in Shopee-Clone
   - Verify order appears in BVA Dashboard

### Common Issues During Development

1. **Port Conflicts** - Ensure services run on different ports
2. **CORS Errors** - Check API URL configuration
3. **Token Mismatch** - Ensure JWT_SECRET is same across services
4. **Database Sync** - Run migrations after schema changes

## Performance Optimization

1. **Caching** - Product/order data cached in Redis
2. **Batch Processing** - Webhooks processed in batches
3. **Rate Limiting** - Prevents API abuse
4. **Pagination** - Large datasets paginated
5. **WebSocket** - Efficient real-time updates

## Future Enhancements

1. **Two-way Sync** - Update Shopee-Clone from BVA
2. **Bulk Import** - Import historical data
3. **Multi-shop Support** - Connect multiple shops
4. **Advanced Filtering** - Custom sync rules
5. **Webhook Retry** - Automatic retry on failure
