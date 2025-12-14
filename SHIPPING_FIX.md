# Shopee-Clone Shipping Fix

## Issue
Sellers in shopee-clone cannot ship orders. The "Ship Now" button is not working.

## Solution Implemented

### 1. Separate Seller Endpoint
- **New Route**: `PATCH /api/orders/seller/:orderId/status`
- **Old Route** (still works for compatibility): `PATCH /api/orders/:id/status`
- The new endpoint includes explicit permission checks for sellers

### 2. Enhanced Error Handling
- Added comprehensive logging throughout the request flow
- Better error messages showing exact failure points
- Frontend shows detailed error messages to users

### 3. Permission Verification
- Verifies seller owns the shop before allowing status update
- Checks shop ownership and access permissions
- Returns clear 403 error if seller doesn't have permission

## Testing Steps

1. **Check Authentication**:
   - Open browser DevTools Console
   - Login as a seller
   - Check if token is stored: `localStorage.getItem('auth_token')`

2. **Try to Ship Order**:
   - Go to Orders → To Ship tab
   - Click "Ship Now" on an order
   - Check console logs for:
     - `🚢 Attempting to ship order: [orderId]`
     - `✅ Token found, updating order status to TO_RECEIVE`
     - `📤 [API] Updating order [orderId] status to TO_RECEIVE via seller endpoint`

3. **Check Server Logs**:
   - Look for:
     - `🚢 [Seller updateOrderStatus] Order ID: [orderId], User ID: [userId]`
     - `🔍 [Seller updateOrderStatus] Order found - Shop ID: [shopId]`
     - `✅ [Seller updateOrderStatus] Permission verified`

4. **Common Issues**:
   - **401 Unauthorized**: Token expired or invalid → Login again
   - **403 Forbidden**: Seller doesn't own the shop → Check shop ownership
   - **404 Not Found**: Order doesn't exist → Refresh orders list
   - **400 Bad Request**: Invalid status → Check status value

## API Endpoint Details

**Endpoint**: `PATCH /api/orders/seller/:orderId/status`

**Request Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "status": "TO_RECEIVE"
}
```

**Valid Status Values**:
- `PENDING` - Order created but not paid
- `TO_SHIP` - Order paid, ready to ship
- `TO_RECEIVE` - Order shipped, in transit
- `COMPLETED` - Order delivered
- `CANCELLED` - Order cancelled
- `RETURNED` - Order returned
- `REFUNDED` - Order refunded
- `FAILED` - Order failed

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "order-id",
    "shopId": "shop-id",
    "status": "TO_RECEIVE",
    ...
  }
}
```

**Error Responses**:

**401 Unauthorized**:
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**403 Forbidden**:
```json
{
  "success": false,
  "error": "You don't have permission to update this order. You must own the shop that this order belongs to."
}
```

**404 Not Found**:
```json
{
  "success": false,
  "error": "Order not found"
}
```

## Debugging

If shipping still doesn't work:

1. **Open Browser Console** (F12)
2. **Check Network Tab**:
   - Look for the PATCH request to `/api/orders/seller/:orderId/status`
   - Check request headers (should include Authorization)
   - Check response status and body
3. **Check Server Console**:
   - Look for the detailed logs starting with `🚢 [Seller updateOrderStatus]`
   - Verify userId and shopId are correct
   - Check if permission check passes
4. **Verify Shop Ownership**:
   - Make sure the logged-in seller owns the shop that the order belongs to
   - Check user's shops: `GET /api/auth/me` should show shops array

## Frontend Code Location

- **API Client**: `shopee-clone/src/services/api.ts` → `updateOrderStatus()`
- **Component**: `shopee-clone/src/features/seller/components/MyOrders.tsx` → `handleShipNow()`
- **Hook**: `shopee-clone/src/hooks/useRealtimeOrders.ts` → Real-time updates

## Backend Code Location

- **Controller**: `server/src/controllers/sellerOrder.controller.ts` → `updateOrderStatus()`
- **Routes**: `server/src/routes/order.routes.ts` → `PATCH /seller/:orderId/status`
- **Service**: `server/src/service/order.service.ts` → `updateOrderStatus()`

