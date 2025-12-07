# Fix: 404 Error for POST /api/products

## Problem
Getting `Cannot POST /api/products` error even though the route is registered.

## Root Cause
The server is running but the route isn't being matched. This can happen when:
1. The server hasn't been restarted after route changes
2. `ts-node-dev` didn't properly reload the route file
3. Route order or middleware is interfering

## Solution: Restart the Server

### Step 1: Stop the Server
In the terminal where the server is running, press `Ctrl+C`.

### Step 2: Restart the Server
```bash
cd server
npm run dev
```

You should see:
```
🚀 Server is running on http://localhost:3000
```

### Step 3: Check Server Logs
After restarting, when you try to POST to `/api/products`, you should see in the server console:
```
[PRODUCT ROUTE] POST /api/products hit
[PRODUCT ROUTE] Headers: { ... }
```

If you see these logs, the route is being hit and the issue is likely with authentication.

### Step 4: Verify Authentication
The POST `/api/products` route requires authentication. Make sure:
1. You're logged in as a seller
2. The `Authorization` header is being sent: `Bearer <token>`
3. The token is valid

### Step 5: Test the Route
```bash
# This should return 401 (Unauthorized) if route is working
# If it returns 404, the route still isn't registered
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test" \
  -d '{"name":"Test Product","price":100}'
```

**Expected responses:**
- `401 Unauthorized` = Route is working, just need valid token ✅
- `404 Not Found` = Route still not registered, server needs restart ❌
- `400 Bad Request` = Route is working, but request body is invalid ✅

## Route Registration

The route is registered in:
- **Route file**: `server/src/routes/product.routes.ts` line 21
- **App registration**: `server/src/app.ts` line 96

```typescript
// In product.routes.ts
router.post("/", authMiddleware, productController.createProduct);

// In app.ts
app.use("/api/products", productRoutes);
```

This creates the route: `POST /api/products`

## Debugging

If the route still doesn't work after restart:

1. **Check server console** for route registration logs
2. **Verify route file** is being loaded: Check for any import errors
3. **Test with curl** to bypass frontend issues
4. **Check middleware** - `authMiddleware` might be blocking before route matches

## Port Configuration

- **Server**: Port 3000 (default)
- **Shopee-Clone**: Port 5174
- **BVA Frontend**: Port 8080
- **Proxy**: Forwards `/api/*` to `http://localhost:3000`

