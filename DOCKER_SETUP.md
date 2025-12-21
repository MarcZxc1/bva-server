# Docker Setup Guide for BVA Server

This guide will help you set up the entire BVA Server project using Docker, eliminating the need for manual installation of dependencies.

## 🚀 Quick Start (3 Steps)

### Step 1: Navigate to Project
```bash
cd /home/marc/project/bva-server
# or wherever you cloned the repository
```

### Step 2: Start All Services
```bash
docker compose up -d
```

### Step 3: Access Your Services
- **Main Dashboard**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **ML Service**: http://localhost:8001
- **ML Service Docs**: http://localhost:8001/docs

**That's it!** All services are now running.

---

## Prerequisites

- **Docker Desktop** (or Docker Engine + Docker Compose)
  - Download from [docker.com](https://www.docker.com/products/docker-desktop)
  - Ensure Docker is running before proceeding

- **Git** (to clone the repository)

This command will:
- Build Docker images for all services
- Install all dependencies automatically
- Start all services in the background

### 3. Wait for Services to Start

The first time you run this, it may take 5-10 minutes to:
- Download base images
- Install Node.js dependencies (npm install)
- Install Python dependencies (pip install)
- Build the applications

You can monitor the progress with:

```bash
docker-compose logs -f
```

### 4. Verify Services are Running

```bash
docker-compose ps
```

You should see all services with status "Up".

## Services and Ports

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| **PostgreSQL** | 5432 | `localhost:5432` | Database |
| **Redis** | 6379 | `localhost:6379` | Cache & Task Queue |
| **Main Server** | 3000 | `http://localhost:3000` | Express/TypeScript API |
| **ML Service** | 8001 | `http://localhost:8001` | Python FastAPI Service |
| **BVA Frontend** | 5173 | `http://localhost:5173` | Main Dashboard (Vite/React) |
| **Lazada Clone** | 3001 | `http://localhost:3001` | Lazada Marketplace Clone (Next.js) |
| **Shopee Clone** | 5174 | `http://localhost:5174` | Shopee Marketplace Clone (Vite/React) |
| **TikTok Seller Clone** | 5175 | `http://localhost:5175` | TikTok Seller Clone (Vite/React) |

## Common Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f main-server
docker-compose logs -f ml-service
docker-compose logs -f bva-frontend
```

### Rebuild After Code Changes
```bash
# Rebuild specific service
docker-compose build main-server
docker-compose up -d main-server

# Rebuild all services
docker-compose build
docker-compose up -d
```

### Access Container Shell
```bash
# Main server
docker-compose exec main-server sh

# ML service
docker-compose exec ml-service bash

# Database
docker-compose exec postgres psql -U postgres -d virtual_business_assistant
```

### Run Database Migrations
```bash
# Generate Prisma client and run migrations
docker-compose exec main-server npx prisma generate
docker-compose exec main-server npx prisma migrate dev
```

### Seed Database
```bash
docker-compose exec main-server npm run db:seed-demo
```

### ML Service Setup

The ML Service provides AI-powered features including:
- **Demand Forecasting**: Predict future sales based on historical data
- **Restock Planning**: Intelligent inventory restocking recommendations
- **Ad Generation**: AI-generated marketing content using Google Gemini
- **Smart Shelf Analytics**: At-risk inventory detection and insights

#### Access ML Service API Documentation

Once the service is running, access the interactive API docs:

```bash
# Swagger UI (Interactive)
http://localhost:8001/docs

# ReDoc (Alternative docs)
http://localhost:8001/redoc

# Health Check
http://localhost:8001/health
```

#### Test ML Service

```bash
# Check if ML service is running
docker-compose exec ml-service curl http://localhost:8001/health

# View ML service logs
docker-compose logs -f ml-service

# Access ML service container
docker-compose exec ml-service bash

# Run ML service tests
docker-compose exec ml-service pytest app/tests/ -v
```

#### ML Service Environment Variables

The ML Service requires the following environment variables:

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GEMINI_API_KEY` | Google Gemini API key for AI features | **Yes** | - |
| `REDIS_URL` | Redis connection URL | No | `redis://redis:6379/0` |
| `CELERY_BROKER_URL` | Celery broker URL | No | `redis://redis:6379/0` |
| `CELERY_RESULT_BACKEND` | Celery result backend | No | `redis://redis:6379/1` |
| `PORT` | Service port | No | `8001` |
| `MODEL_DIR` | Directory for ML models | No | `/app/models` |
| `LOG_LEVEL` | Logging level | No | `INFO` |
| `BACKEND_API_URL` | Main server URL for callbacks | No | - |

**Getting a Gemini API Key:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and add it to `ml-service/.env`

#### Celery Workers (Background Tasks)

The ML Service uses Celery for background task processing. Workers are automatically started with docker-compose:

```bash
# View Celery worker logs
docker-compose logs -f celery-worker

# View Celery beat (scheduler) logs
docker-compose logs -f celery-beat

# Restart Celery workers
docker-compose restart celery-worker celery-beat
```

## Environment Variables

### Setting Environment Variables

You can set environment variables in two ways:

#### Option 1: Using .env files (Recommended)

Create `.env` files in each service directory:

**`server/.env`**
```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/virtual_business_assistant
ML_SERVICE_URL=http://ml-service:8001
PORT=3000
NODE_ENV=development
REDIS_URL=redis://redis:6379
JWT_SECRET=your_jwt_secret_here
```

**`ml-service/.env`**
```env
# Redis Configuration
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/1

# Service Configuration
PORT=8001
HOST=0.0.0.0
DEBUG=false
LOG_LEVEL=INFO
LOG_FORMAT=json

# Model Configuration
MODEL_DIR=/app/models
MODEL_CACHE_DAYS=7
DEFAULT_FORECAST_PERIODS=14
DEFAULT_FORECAST_METHOD=auto

# Google Gemini API (Required for AI features)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp
IMAGEN_MODEL=gemini-2.5-flash-image

# Backend API (Optional - for callbacks)
BACKEND_API_URL=http://main-server:3000
BACKEND_API_KEY=optional_api_key

# Social Media APIs (Optional)
FACEBOOK_ACCESS_TOKEN=optional_facebook_token
INSTAGRAM_ACCESS_TOKEN=optional_instagram_token
```

**`bva-frontend/.env`**
```env
VITE_API_URL=http://localhost:3000
```

#### Option 2: Using docker-compose.yml

Edit the `environment` section in `docker-compose.yml` for each service.

## Development Workflow

### Hot Reload

All services are configured with hot reload in development mode:
- **Main Server**: Uses `ts-node-dev` for TypeScript hot reload
- **ML Service**: Uses `uvicorn --reload` for Python hot reload
- **Frontend Services**: Vite/Next.js hot reload is enabled

Changes to source code are automatically reflected without rebuilding containers.

### Making Code Changes

1. Edit code in your local files
2. Changes are automatically synced to containers via volumes
3. Services will automatically reload (hot reload)

### Installing New Dependencies

#### Node.js Services (Main Server, Frontends)

```bash
# Option 1: Edit package.json, then rebuild
docker-compose build main-server
docker-compose up -d main-server

# Option 2: Install inside container (temporary)
docker-compose exec main-server npm install <package-name>
```

#### Python Service (ML Service)

```bash
# Edit requirements.txt, then rebuild
docker-compose build ml-service
docker-compose up -d ml-service

# Or install a package temporarily inside container
docker-compose exec ml-service pip install <package-name>
# Then add it to requirements.txt and rebuild for persistence
```

## Troubleshooting

### Services Won't Start

1. **Check logs:**
   ```bash
   docker-compose logs
   ```

2. **Check if ports are already in use:**
   ```bash
   # Linux/Mac
   lsof -i :3000
   lsof -i :8001
   
   # Windows (PowerShell)
   netstat -ano | findstr :3000
   ```

3. **Rebuild from scratch:**
   ```bash
   docker-compose down -v  # Removes volumes too
   docker-compose build --no-cache
   docker-compose up -d
   ```

### Database Connection Issues

1. **Wait for database to be ready:**
   ```bash
   docker-compose logs postgres
   ```
   Look for "database system is ready to accept connections"

2. **Check database URL:**
   Ensure `DATABASE_URL` uses `postgres` as hostname (not `localhost`) when running in Docker.

### Out of Memory Errors

If you encounter memory issues:

1. **Increase Docker memory limit:**
   - Docker Desktop: Settings → Resources → Memory (increase to 4GB+)

2. **Start services selectively:**
   ```bash
   # Start only essential services
   docker-compose up -d postgres redis main-server ml-service
   ```

### Clean Up

```bash
# Stop and remove containers
docker-compose down

# Remove containers, networks, and volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Complete cleanup (removes everything)
docker-compose down -v --rmi all
```

## Production Deployment

For production, use the production Dockerfiles:

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                        │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Frontend   │  │   Frontend   │  │   Frontend   │  │
│  │  Services    │  │  Services    │  │  Services    │  │
│  │  (Vite/Next) │  │  (Vite/Next) │  │  (Vite/Next) │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │          │
│         └─────────────────┼─────────────────┘          │
│                           │                            │
│                  ┌────────▼────────┐                   │
│                  │  Main Server    │                   │
│                  │  (Express/TS)   │                   │
│                  └────────┬────────┘                   │
│                           │                            │
│         ┌─────────────────┼─────────────────┐          │
│         │                 │                 │          │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐  │
│  │ PostgreSQL  │  │    Redis     │  │ ML Service  │  │
│  │  Database   │  │   Cache     │  │  (FastAPI)  │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Benefits of Docker Setup

✅ **No Manual Installation**: All dependencies are installed automatically  
✅ **Consistent Environment**: Same environment for all team members  
✅ **Isolated Services**: Each service runs in its own container  
✅ **Easy Cleanup**: Remove everything with one command  
✅ **Hot Reload**: Code changes reflect immediately  
✅ **Production Ready**: Same setup can be used for production  

## Next Steps

1. **Set up environment variables** (see Environment Variables section)
   - **Important**: Add `GEMINI_API_KEY` to `ml-service/.env` for AI features
2. **Run database migrations** (see Common Commands)
3. **Seed sample data** (see Common Commands)
4. **Access the applications** at their respective URLs:
   - Main Dashboard: http://localhost:5173
   - API Server: http://localhost:3000
   - ML Service API Docs: http://localhost:8001/docs
   - Lazada Clone: http://localhost:3001
   - Shopee Clone: http://localhost:5174
   - TikTok Seller: http://localhost:5175

## Support

If you encounter issues:
1. Check the logs: `docker-compose logs`
2. Verify Docker is running: `docker ps`
3. Check service health: `docker-compose ps`
4. Review this guide's Troubleshooting section

