# Docker Deployment Guide for Linux

This guide covers deploying the Virtual Business Assistant application on Linux using Docker Engine (no PostgreSQL installation required).

## Prerequisites

- Linux OS with Docker Engine installed
- Docker Compose installed
- Git installed
- Ports available: 3000 (backend), 8001 (ML service), 5432 (PostgreSQL), 6379 (Redis), 8080 (frontend)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/MarcZxc1/bva-server.git
cd bva-server
```

### 2. Start Database Services (PostgreSQL + Redis)

```bash
docker compose up -d postgres redis
```

This will:

- Download and start PostgreSQL container (no local installation needed)
- Download and start Redis container
- Create persistent volumes for data storage
- Expose PostgreSQL on port 5432 and Redis on port 6379

**Wait for services to be healthy (about 10-30 seconds):**

```bash
docker compose ps
```

### 3. Set Up Backend Server

```bash
cd server

# Install dependencies
npm install

# Run database migrations and seed data
npx prisma migrate dev
npx prisma db seed

# Start the backend server
npm run dev
```

Backend will be running on http://localhost:5000

### 4. Set Up ML Service

Open a new terminal:

```bash
cd ml-service

# Create Python virtual environment (optional but recommended)
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the ML service
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

ML Service will be running on http://localhost:8001

### 5. Set Up Frontend

Open a new terminal:

```bash
cd bva-frontend

# Install dependencies
npm install

# Start the frontend development server
npm run dev
```

Frontend will be running on http://localhost:8080

## Alternative: Full Docker Deployment

If you want to run **everything** in Docker containers:

```bash
# Build and start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

**Note:** The main-server service in docker-compose.yml needs the DATABASE_URL adjusted for containerized deployment. It's currently set for development where backend runs locally.

## Recommended Development Setup

For the best development experience on Linux:

1. **Run in Docker:** PostgreSQL, Redis
2. **Run locally:** Backend (npm run dev), ML Service (uvicorn), Frontend (npm run dev)

This gives you:

- ✅ Hot reload for code changes
- ✅ Easy debugging
- ✅ No PostgreSQL/Redis installation needed
- ✅ Persistent data in Docker volumes

## Environment Variables

### Backend Server (.env file in server/)

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/virtual_business_assistant
ML_SERVICE_URL=http://localhost:8001
PORT=5000
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

### ML Service (.env file in ml-service/)

```env
REDIS_URL=redis://localhost:6379/0
MODEL_DIR=./models
LOG_LEVEL=INFO
PORT=8001
```

### Frontend (.env file in bva-frontend/)

```env
VITE_API_BASE_URL=http://localhost:5000
```

## Common Docker Commands

```bash
# Start PostgreSQL and Redis only
docker compose up -d postgres redis

# View logs
docker compose logs -f postgres
docker compose logs -f redis

# Stop services
docker compose down

# Stop and remove volumes (deletes all data)
docker compose down -v

# Restart a service
docker compose restart postgres

# Check service health
docker compose ps

# Access PostgreSQL CLI
docker exec -it vba-postgres psql -U postgres -d virtual_business_assistant

# Access Redis CLI
docker exec -it vba-redis redis-cli
```

## Troubleshooting

### PostgreSQL Connection Issues

```bash
# Check if PostgreSQL is running
docker compose ps postgres

# View PostgreSQL logs
docker compose logs postgres

# Restart PostgreSQL
docker compose restart postgres
```

### Port Already in Use

```bash
# Find what's using port 5432 (PostgreSQL)
sudo lsof -i :5432

# Kill the process if needed
sudo kill -9 <PID>

# Or change the port in docker-compose.yml
ports:
  - "5433:5432"  # Use host port 5433 instead
```

### Reset Database

```bash
# Stop PostgreSQL
docker compose down postgres

# Remove the volume (deletes all data)
docker volume rm bva-server_postgres-data

# Start fresh
docker compose up -d postgres
cd server
npx prisma migrate dev
npx prisma db seed
```

## Data Persistence

Docker volumes are used for data persistence:

- `postgres-data`: PostgreSQL database files
- `redis-data`: Redis cache and queue data

These volumes persist even when containers are stopped. To completely remove data, use:

```bash
docker compose down -v
```

## Production Deployment

For production on Linux:

1. **Update docker-compose.yml:**

   - Change `NODE_ENV=production`
   - Use environment-specific secrets
   - Remove volume mounts for source code
   - Use `--build` flag to rebuild images

2. **Use production build:**

```bash
# Build all images
docker compose build

# Start in production mode
docker compose up -d

# View logs
docker compose logs -f
```

3. **Set up reverse proxy** (Nginx/Traefik) for SSL and domain routing

4. **Configure firewall** to allow only necessary ports

## Services Overview

| Service    | Port | Purpose        | Requires Installation? |
| ---------- | ---- | -------------- | ---------------------- |
| PostgreSQL | 5432 | Database       | ❌ No (Docker)         |
| Redis      | 6379 | Cache/Queue    | ❌ No (Docker)         |
| Backend    | 5000 | Express API    | ✅ Yes (npm)           |
| ML Service | 8001 | Python FastAPI | ✅ Yes (pip)           |
| Frontend   | 8080 | React App      | ✅ Yes (npm)           |

## Next Steps

1. Access the application at http://localhost:8080
2. Login with seeded credentials (check server/prisma/seed.ts)
3. Navigate to Smart Inventory to see the ML-powered inventory analysis
4. Check API documentation at http://localhost:8001/docs (ML Service)

## Support

For issues or questions:

- Check logs: `docker compose logs -f`
- Verify all services are running: `docker compose ps`
- Ensure ports are not blocked by firewall
