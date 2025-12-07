# Port Configuration Summary

## Service Ports

| Service | Port | Configuration File |
|---------|------|-------------------|
| **Server** (Node.js/Express) | 3000 | `server/src/server.ts` |
| **BVA Frontend** (React/Vite) | 8080 | `bva-frontend/vite.config.ts` |
| **Shopee-Clone** (React/Vite) | 5173 | `shopee-clone/vite.config.ts` |
| **ML Service** (Python/FastAPI) | 8000 | `ml-service/app/config.py` |

## API Integration Points

### Shopee-Clone → Server
- **Proxy Configuration**: `shopee-clone/vite.config.ts`
  - Proxies `/api/*` requests to `http://localhost:3000`
  - Port: 5173

### BVA Frontend → Server
- **Proxy Configuration**: `bva-frontend/vite.config.ts`
  - Proxies `/api/*` requests to `http://localhost:3000`
  - Port: 8080

### Server → ML Service
- **Client Configuration**: `server/src/utils/mlClient.ts`
  - Default URL: `http://localhost:8000`
  - Can be overridden with `ML_SERVICE_URL` environment variable

## CORS Configuration

### Server CORS (`server/src/app.ts`)
Allows requests from:
- `http://localhost:5173` (Shopee-Clone)
- `http://localhost:8080` (BVA Frontend)
- Production URLs (Vercel)

### Socket.IO CORS (`server/src/services/socket.service.ts`)
Allows WebSocket connections from:
- `http://localhost:5173` (Shopee-Clone)
- `http://localhost:8080` (BVA Frontend)
- Production URLs (Vercel)

### Auth Routes CORS (`server/src/routes/auth.routes.ts`)
Allows OAuth redirects to:
- `http://localhost:5173` (Shopee-Clone)
- `http://localhost:8080` (BVA Frontend)
- Production URLs (Vercel)

## Environment Variables

### Server
```bash
PORT=3000  # Default, can be overridden
ML_SERVICE_URL=http://localhost:8000  # Optional, defaults to 8000
```

### ML Service
```bash
PORT=8000  # Default in config.py
```

## Verification

To verify all services are running on correct ports:

```bash
# Check Server
curl http://localhost:3000/health

# Check BVA Frontend
curl http://localhost:8080

# Check Shopee-Clone
curl http://localhost:5173

# Check ML Service
curl http://localhost:8000/health
```

## Troubleshooting

### Port Conflicts
If a port is already in use:
```bash
# Find process using port
lsof -i :PORT_NUMBER

# Kill process (if needed)
kill -9 PID
```

### CORS Errors
If you see CORS errors:
1. Verify the frontend port matches the CORS configuration
2. Restart the server after changing CORS settings
3. Check browser console for specific CORS error messages

### Proxy Not Working
If API requests fail:
1. Verify the proxy target port matches the server port
2. Restart the Vite dev server after changing proxy config
3. Check browser network tab for request details

