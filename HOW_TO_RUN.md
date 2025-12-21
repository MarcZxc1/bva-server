# How to Run the Services

## 🚀 Quick Start (3 Steps)

### Step 1: Navigate to Project
```bash
cd /home/marc/project/bva-server
```

### Step 2: Start All Services
```bash
docker compose up -d
```

### Step 3: Wait for Services to Start
```bash
# Check status
docker compose ps

# View logs to see progress
docker compose logs -f
```

**That's it!** All services are now running.

---

## 📍 Access Your Services

Once running, open these URLs in your browser:

- **Main Dashboard**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **ML Service API**: http://localhost:8001
- **ML Service Docs**: http://localhost:8001/docs
- **Lazada Clone**: http://localhost:3001
- **Shopee Clone**: http://localhost:5174
- **TikTok Seller**: http://localhost:5175

---

## 🔧 First Time Setup (One-Time Only)

### 1. Set ML Service API Key (Required for AI features)

```bash
# Create .env file for ML service
cd ml-service
cp .env.example .env

# Edit the file and add your Gemini API key
nano .env
# Add: GEMINI_API_KEY=your_api_key_here

cd ..
```

**Get API Key**: https://makersuite.google.com/app/apikey

### 2. Setup Database (First time only)

```bash
# Generate Prisma client
docker compose exec main-server npx prisma generate

# Run database migrations
docker compose exec main-server npx prisma migrate dev

# Seed sample data (optional)
docker compose exec main-server npm run db:seed-demo
```

---

## 📋 Daily Usage Commands

### Start Services
```bash
docker compose up -d
```

### Stop Services
```bash
docker compose down
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f main-server
docker compose logs -f ml-service
docker compose logs -f bva-frontend
```

### Restart a Service
```bash
docker compose restart main-server
docker compose restart ml-service
```

### Check Service Status
```bash
docker compose ps
```

---

## 🎯 Run Only Specific Services

### Core Services Only (Server + ML + Database)
```bash
docker compose up -d postgres redis ml-service main-server
```

### Add Frontends Later
```bash
docker compose up -d bva-frontend lazada-clone shopee-clone
```

---

## 🐛 Troubleshooting

### Services Not Starting?
```bash
# Check logs
docker compose logs

# Rebuild from scratch
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

### Port Already in Use?
```bash
# Find what's using the port
lsof -i :3000
lsof -i :8001

# Or change ports in docker-compose.yml
```

### ML Service Not Working?
```bash
# Check if API key is set
docker compose exec ml-service env | grep GEMINI

# Check logs
docker compose logs -f ml-service
```

---

## ✅ Verify Everything is Working

```bash
# Test main server
curl http://localhost:3000/health

# Test ML service
curl http://localhost:8001/health

# Check all services status
docker compose ps
```

All services should show "Up" status.

---

## 📚 More Help

- **Detailed Guide**: See `DOCKER_QUICK_START.md`
- **Full Documentation**: See `DOCKER_SETUP.md`
- **Helper Script**: Run `./docker-start.sh` for interactive menu

