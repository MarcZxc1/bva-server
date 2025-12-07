# Real-Time WebSocket Implementation Guide

## Overview
This document describes the real-time WebSocket synchronization system implemented for the BVA ecosystem, enabling instant updates when buyers place orders in Shopee-Clone.

## Architecture

### Flow Diagram
```
Buyer (Shopee-Clone) 
  → POST /api/orders 
  → Order Service (Transaction)
  → Database Update
  → Socket.IO Emit
  → Seller Dashboard (BVA Frontend)
  → Real-time UI Update
```

## Backend Implementation

### 1. Socket.IO Server Setup

**File:** `server/src/server.ts`
- Creates HTTP server from Express app
- Initializes Socket.IO with CORS configuration
- Supports both WebSocket and polling transports

**File:** `server/src/services/socket.service.ts`
- `initializeSocketIO(httpServer)`: Sets up Socket.IO server
- `notifyNewOrder(data)`: Emits new order to shop room
- `notifyLowStock(data)`: Emits low stock alerts
- `notifyInventoryUpdate(shopId, updates)`: Emits inventory changes

### 2. Order Service with Transactions

**File:** `server/src/service/order.service.ts`
- Uses `prisma.$transaction()` for atomic operations
- Creates Sale record and decrements inventory atomically
- Emits socket events after successful transaction
- Checks for low stock (threshold: 5 units) and emits alerts

**Key Features:**
- Atomic database operations (all-or-nothing)
- Non-blocking socket emissions using `setImmediate()`
- Automatic inventory log creation
- Low stock detection and alerts

### 3. Socket Events

**Event Types:**
- `dashboard_update` (type: `new_order`): New order received
- `dashboard_update` (type: `low_stock`): Product stock below threshold
- `dashboard_update` (type: `inventory_update`): Inventory changed

**Room Management:**
- Clients join `shop_{shopId}` room
- Events are emitted to specific shop rooms
- Multi-tenant support (sellers only see their shop's events)

## Frontend Implementation

### 1. Real-Time Dashboard Hook

**File:** `bva-frontend/src/hooks/useRealtimeDashboard.ts`

**Features:**
- Connects to Socket.IO server on mount
- Joins shop room automatically
- Listens for `dashboard_update` events
- Updates React Query cache optimistically
- Shows toast notifications for events
- Handles reconnection automatically

**Usage:**
```typescript
const { isConnected } = useRealtimeDashboard({ 
  shopId: shopId || undefined, 
  enabled: hasShop 
});
```

### 2. Dashboard Integration

**File:** `bva-frontend/src/pages/Dashboard.tsx`
- Integrates `useRealtimeDashboard` hook
- Shows connection status indicator (Live/Offline)
- Automatically updates metrics on new orders
- Invalidates queries to refresh data

**Real-time Updates:**
- Total Sales: Increments on new order
- Total Revenue: Adds order revenue
- Total Profit: Adds order profit
- Stock Alerts: Refreshes on inventory updates

## Event Payloads

### New Order Event
```typescript
{
  type: "new_order",
  data: {
    orderId: string;
    total: number;
    revenue: number;
    profit: number;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      price: number;
    }>;
    customerEmail?: string;
    createdAt: Date;
  }
}
```

### Low Stock Alert
```typescript
{
  type: "low_stock",
  data: {
    productId: string;
    productName: string;
    currentStock: number;
    threshold: number;
  }
}
```

### Inventory Update
```typescript
{
  type: "inventory_update",
  data: {
    updates: Array<{
      productId: string;
      productName: string;
      newStock: number;
    }>;
  }
}
```

## Testing

### Manual Testing Steps

1. **Start Services:**
   ```bash
   # Terminal 1: Server
   cd server && npm run dev
   
   # Terminal 2: BVA Frontend
   cd bva-frontend && npm run dev
   
   # Terminal 3: Shopee Clone
   cd shopee-clone && npm run dev
   ```

2. **Test Real-Time Order Flow:**
   - Open BVA Dashboard as seller (http://localhost:8080)
   - Verify "Live" indicator shows connected status
   - Open Shopee Clone as buyer (http://localhost:5174)
   - Login as buyer and add items to cart
   - Place an order
   - **Expected:** Seller dashboard updates instantly:
     - Toast notification: "New Order Received! 💰"
     - Total Sales increments
     - Revenue increases
     - Inventory updates

3. **Test Low Stock Alert:**
   - Place order that reduces stock below 5 units
   - **Expected:** Toast notification: "Low Stock Alert ⚠️"

4. **Test Connection Status:**
   - Stop server
   - **Expected:** Dashboard shows "Offline" status
   - Restart server
   - **Expected:** Automatically reconnects and shows "Live"

## Configuration

### Environment Variables

**Server:**
- `PORT`: Server port (default: 3000)
- `VITE_API_URL`: Frontend API URL (for CORS)

**Frontend:**
- `VITE_API_URL`: Socket.IO server URL (default: http://localhost:3000)

### Socket.IO Configuration

**CORS Origins:**
- http://localhost:5174 (Shopee Clone)
- http://localhost:8080 (BVA Frontend)
- Production URLs (if deployed)

**Transports:**
- WebSocket (primary)
- Polling (fallback)

## Performance Considerations

1. **Non-blocking Emissions:** Socket events are emitted using `setImmediate()` to avoid blocking the transaction
2. **Room-based Broadcasting:** Events only sent to relevant shop rooms
3. **Optimistic Updates:** Frontend updates cache immediately, then refetches for consistency
4. **Automatic Reconnection:** Socket.IO handles reconnection automatically
5. **Query Invalidation:** React Query invalidates queries to ensure data consistency

## Troubleshooting

### Socket Not Connecting
- Check server is running on correct port
- Verify CORS configuration includes frontend URL
- Check browser console for connection errors
- Ensure `VITE_API_URL` is set correctly

### Events Not Received
- Verify shopId is correct
- Check client joined correct room (`shop_{shopId}`)
- Verify socket connection status in browser DevTools
- Check server logs for emitted events

### TypeScript Errors
- Run `npm run build` in server directory
- Check all imports are correct
- Verify socket.io types are installed

## Future Enhancements

1. **Order Status Updates:** Real-time order status changes
2. **Chat Integration:** Real-time messaging between buyer and seller
3. **Analytics Updates:** Real-time chart updates
4. **Multi-shop Support:** Handle multiple shops per seller
5. **Presence Indicators:** Show when sellers are online
6. **Notification Center:** Centralized notification system

