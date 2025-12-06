# 🚀 ML Service Quick Start Guide

## The Problem
You're getting this error:
```
ERROR: Error loading ASGI app. Attribute "main:app" not found in module "app".
```

## The Solution

The correct uvicorn command syntax is:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

**Note:** Use **dots** (`.`) for module path, not colons (`:`)

---

## 🎯 Quick Start Options

### Option 1: Use the Startup Script (Recommended)
```bash
cd ml-service
./start.sh
```

### Option 2: Manual Start
```bash
cd ml-service

# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate     # Windows

# Start the server
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Option 3: Docker Compose
```bash
cd ml-service
docker-compose up
```
Note: Docker runs on port 8000, but you can modify docker-compose.yml to use 8001

---

## ✅ Success Indicators

When the server starts correctly, you should see:
```
INFO:     Will watch for changes in these directories: ['/home/marc/cloned/bva-server/ml-service']
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
INFO:     Started reloader process [XXXXX] using WatchFiles
INFO:     Started server process [XXXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

---

## 🔍 Verify It's Working

1. **Health Check:**
   ```bash
   curl http://localhost:8001/health
   ```
   Should return: `{"status":"healthy"}`

2. **API Documentation:**
   Open in browser: http://localhost:8001/docs

3. **Test from Backend:**
   The Node.js server should now be able to connect to the ML service.

---

## 🐛 Common Issues

### Issue: "Module not found"
**Solution:** Make sure you're in the `ml-service` directory and the `app/` folder exists.

### Issue: "Port already in use"
**Solution:** 
- Check if another process is using port 8001: `lsof -i :8001` (Linux/Mac) or `netstat -ano | findstr :8001` (Windows)
- Kill the process or use a different port

### Issue: "Cannot reach ML service"
**Solution:**
- Verify the service is running: `curl http://localhost:8001/health`
- Check the server logs for errors
- Verify the ML_SERVICE_URL in your server's `.env` file matches the port

---

## 📝 Environment Variables

The ML service uses these environment variables (optional):
- `REDIS_URL` - Redis connection string (default: `redis://localhost:6379/0`)
- `LOG_LEVEL` - Logging level (default: `INFO`)
- `MODEL_DIR` - Directory for saved models (default: `./models`)

---

## 🔗 Integration with Backend

The Node.js backend expects the ML service at:
- **URL:** `http://localhost:8001` (or `ML_SERVICE_URL` env var)
- **Endpoints:**
  - `/api/v1/restock/plan` - Restock planning
  - `/api/v1/smart-shelf/at-risk` - At-risk inventory
  - `/api/v1/forecast` - Demand forecasting

---

**Need Help?** Check the main README.md for more details.

