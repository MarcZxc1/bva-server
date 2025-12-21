# Docker Quick Start Guide

## 🚀 Running All Services (Complete Stack)

### Step 1: Navigate to Project Root
```bash
cd /home/marc/project/bva-server
# or
cd ~/Documents/bva-server
```

### Step 2: Start All Services
```bash
# Start all services in the background
docker compose up -d

# Or use the helper script
./docker-start.sh
```

This will start:
- ✅ PostgreSQL Database
- ✅ Redis Cache
- ✅ ML Service (Python/FastAPI)
- ✅ Main Server (Node.js/Express)
- ✅ BVA Frontend (React/Vite)
- ✅ Lazada Clone (Next.js)
- ✅ Shopee Clone (React/Vite)
- ✅ TikTok Seller Clone (React/Vite)
- ✅ Celery Workers (Background tasks)

### Step 3: Check Status
```bash
# See all running services
docker compose ps

# Check logs
docker compose logs -f
```

### Step 4: Access Services

Once running, access your services at:

| Service | URL | Description |
|---------|-----|-------------|
| **BVA Frontend** | http://localhost:5173 | Main Dashboard |
| **Main Server API** | http://localhost:3000 | Backend API |
| **ML Service API** | http://localhost:8001 | ML/AI Service |
| **ML Service Docs** | http://localhost:8001/docs | API Documentation |
| **Lazada Clone** | http://localhost:3001 | Lazada Marketplace |
| **Shopee Clone** | http://localhost:5174 | Shopee Marketplace |
| **TikTok Seller** | http://localhost:5175 | TikTok Seller |

---

## 🎯 Running Specific Services Only

### Option 1: Start Only Core Services (Server + ML + Database)

```bash
# Start only essential services
docker compose up -d postgres redis ml-service main-server
```

### Option 2: Start Server + ML Service Only

```bash
# Start database, redis, server, and ml-service
docker compose up -d postgres redis main-server ml-service
```

### Option 3: Start Frontends Only (after core services are running)

```bash
# Start all frontends
docker compose up -d bva-frontend lazada-clone shopee-clone tiktokseller-clone

# Or start specific frontend
docker compose up -d bva-frontend
```

---

## 📋 Common Commands

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f main-server
docker compose logs -f ml-service
docker compose logs -f bva-frontend

# Last 100 lines
docker compose logs --tail=100 ml-service
```

### Stop Services

```bash
# Stop all services
docker compose down

# Stop specific service
docker compose stop main-server

# Stop and remove volumes (⚠️ deletes database data)
docker compose down -v
```

### Restart Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart main-server
docker compose restart ml-service
```

### Rebuild After Code Changes

```bash
# Rebuild specific service
docker compose build main-server
docker compose up -d main-server

# Rebuild all
docker compose build
docker compose up -d
```

---

## 🔧 Setup Steps (First Time)

### 1. Set Environment Variables

Create `.env` files for services that need them:

```bash
# ML Service (REQUIRED for AI features)
cd ml-service
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
nano .env  # or use your preferred editor

# Server (optional - has defaults)
cd ../server
cp .env.example .env  # if exists
# Edit as needed

# Frontend (optional)
cd ../bva-frontend
cp .env.example .env  # if exists
```

### 2. Start Services

```bash
cd /home/marc/project/bva-server
docker compose up -d
```

### 3. Setup Database

```bash
# Generate Prisma client
docker compose exec main-server npx prisma generate

# Run migrations
docker compose exec main-server npx prisma migrate dev

# Seed sample data (optional)
docker compose exec main-server npm run db:seed-demo
```

---

## 🐛 Troubleshooting

### Services Won't Start

```bash
# Check what's wrong
docker compose logs

# Check specific service
docker compose logs ml-service
docker compose logs main-server

# Rebuild from scratch
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

### Port Already in Use

```bash
# Find what's using the port
# Linux/Mac
lsof -i :3000
lsof -i :8001

# Kill the process or change port in docker-compose.yml
```

### ML Service Not Working

```bash
# Check if GEMINI_API_KEY is set
docker compose exec ml-service env | grep GEMINI

# Check ML service logs
docker compose logs -f ml-service

# Test ML service health
curl http://localhost:8001/health
```

### Database Connection Issues

```bash
# Wait for database to be ready
docker compose logs postgres

# Test database connection
docker compose exec postgres psql -U postgres -d virtual_business_assistant -c "SELECT 1;"
```

---

## 📊 Service Status

### Check All Services

```bash
docker compose ps
```

Expected output:
```
NAME                    STATUS          PORTS
vba-postgres           Up (healthy)    0.0.0.0:5432->5432/tcp
vba-redis              Up (healthy)    0.0.0.0:6379->6379/tcp
vba-ml-service         Up              0.0.0.0:8001->8001/tcp
vba-main-server        Up              0.0.0.0:3000->3000/tcp
vba-frontend           Up              0.0.0.0:5173->5173/tcp
vba-lazada-clone       Up              0.0.0.0:3001->3001/tcp
vba-shopee-clone       Up              0.0.0.0:5174->5173/tcp
vba-tiktokseller-clone Up              0.0.0.0:5175->5173/tcp
```

### Check Service Health

```bash
# Test main server
curl http://localhost:3000/health

# Test ML service
curl http://localhost:8001/health

# Test database
docker compose exec postgres pg_isready -U postgres
```

---

## 🎯 Quick Reference

### Start Everything
```bash
docker compose up -d
```

### Stop Everything
```bash
docker compose down
```

### View Logs
```bash
docker compose logs -f
```

### Rebuild Everything
```bash
docker compose build && docker compose up -d
```

### Access Container Shell
```bash
# Main server
docker compose exec main-server sh

# ML service
docker compose exec ml-service bash

# Database
docker compose exec postgres psql -U postgres -d virtual_business_assistant
```

---

## 💡 Pro Tips

1. **First Time Setup**: The first `docker compose up -d` will take 5-10 minutes to download images and install dependencies.

2. **Hot Reload**: All services support hot reload - code changes are automatically reflected without rebuilding.

3. **Resource Usage**: If your machine is slow, start only essential services:
   ```bash
   docker compose up -d postgres redis main-server ml-service
   ```

4. **View Real-time Logs**: Keep a terminal open with:
   ```bash
   docker compose logs -f
   ```

5. **Clean Start**: If something goes wrong:
   ```bash
   docker compose down -v
   docker compose build --no-cache
   docker compose up -d
   ```

