# Quick Fix: 404 Error for /api/products

## Problem
Getting `Cannot POST /api/products` or `Cannot GET /api/products` errors.

## Solution: Restart the Server

The server needs to be restarted to load the latest routes. Here's how:

### Step 1: Stop the Current Server
In the terminal where the server is running, press `Ctrl+C` to stop it.

### Step 2: Restart the Server
```bash
cd server
npm run dev
```

The server should now start on **port 3000** (updated default).

### Step 3: Verify It's Working
Open a new terminal and test:
```bash
# Test GET request
curl http://localhost:3000/api/products

# Test POST request (will fail auth, but should not be 404)
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test" \
  -d '{"name":"Test","price":100}'
```

If you get a 401 (Unauthorized) instead of 404, the route is working! You just need to be authenticated.

### Step 4: Restart Shopee-Clone Frontend
After restarting the server, restart the frontend to reconnect:
```bash
cd shopee-clone
npm run dev
```

## Port Configuration Summary

- **Main Server**: Port 3000 (updated default)
- **BVA Frontend**: Port 8080
- **Shopee-Clone**: Port 5174
- **Vite Proxy**: Forwards `/api/*` to `http://localhost:3000`

## If Still Not Working

1. **Check server console** for any errors during startup
2. **Verify route registration**: Check `server/src/app.ts` line 96 should have `app.use("/api/products", productRoutes);`
3. **Check route file**: `server/src/routes/product.routes.ts` should have `router.post("/", authMiddleware, productController.createProduct);`
4. **Rebuild if needed**: `cd server && npm run build && npm start`

