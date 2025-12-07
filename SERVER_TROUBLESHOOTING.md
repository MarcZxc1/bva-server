# Server Troubleshooting Guide

## Issue: 404 Not Found for /api/products

### Symptoms
- Frontend gets 404 when calling `/api/products`
- Server health check works (`/health` returns `{"status":"up"}`)
- Server root (`/`) shows `/api/products` in endpoints list
- But direct curl to `/api/products` returns "Cannot GET /api/products"

### Root Cause
The server might be running old compiled code or the route isn't being registered properly.

### Solutions

#### Solution 1: Restart the Server
The server is running with `ts-node-dev` which should auto-reload, but sometimes it needs a manual restart:

```bash
# Stop the server (Ctrl+C in the terminal running it)
# Then restart:
cd server
npm run dev
```

#### Solution 2: Rebuild the Server
If using compiled code:

```bash
cd server
npm run build
# Then restart the server
npm start
```

#### Solution 3: Check Server Port
Verify the server is running on the port specified in `vite.config.ts`:

```bash
# Check what port the server is actually using
lsof -i :3000
lsof -i :5000

# The server default is 5000, but vite.config.ts proxy targets 3000
# Update vite.config.ts proxy target to match your server port
```

#### Solution 4: Verify Route Registration
Check that the route is properly exported and imported:

1. **Check route file**: `server/src/routes/product.routes.ts`
   - Should have: `export default router;`
   - Should have: `router.get("/", productController.getAllProducts);`

2. **Check app.ts**: `server/src/app.ts`
   - Should have: `app.use("/api/products", productRoutes);`

3. **Check controller**: `server/src/controllers/product.controller.ts`
   - Should have: `export const getAllProducts = async (req, res) => {...}`

#### Solution 5: Test Direct Connection
Test if the server responds directly (bypassing proxy):

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test products endpoint
curl http://localhost:3000/api/products

# If these work, the issue is with the proxy configuration
# If these don't work, the server needs to be restarted/rebuilt
```

### Quick Fix Commands

```bash
# 1. Navigate to server directory
cd server

# 2. Rebuild (if using compiled code)
npm run build

# 3. Restart dev server
npm run dev

# 4. In another terminal, verify it's working
curl http://localhost:3000/api/products
```

### Environment Variables

Make sure your server is using the correct port:

```bash
# Set PORT environment variable if needed
export PORT=3000
npm run dev

# Or create/update .env file in server directory:
# PORT=3000
```

### Proxy Configuration

The Vite proxy in `shopee-clone/vite.config.ts` should match your server port:

```typescript
proxy: {
  '/api': {
    target: process.env.VITE_API_URL || 'http://localhost:3000', // Match your server port
    // ...
  }
}
```

If your server runs on port 5000, update to:
```typescript
target: process.env.VITE_API_URL || 'http://localhost:5000',
```

