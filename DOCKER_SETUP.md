# Docker Setup Guide for BVA Server

This guide will help you set up the entire BVA Server project using Docker, eliminating the need for manual installation of dependencies.

## Prerequisites

- **Docker Desktop** (or Docker Engine + Docker Compose)
  - Download from [docker.com](https://www.docker.com/products/docker-desktop)
  - Ensure Docker is running before proceeding

- **Git** (to clone the repository)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd bva-server
```

### 2. Start All Services

```bash
docker-compose up -d
```

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
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/1
PORT=8001
GEMINI_API_KEY=your_gemini_api_key_here
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
2. **Run database migrations** (see Common Commands)
3. **Seed sample data** (see Common Commands)
4. **Access the applications** at their respective URLs

## Support

If you encounter issues:
1. Check the logs: `docker-compose logs`
2. Verify Docker is running: `docker ps`
3. Check service health: `docker-compose ps`
4. Review this guide's Troubleshooting section

