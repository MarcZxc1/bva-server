# Quick Start Guide - Running All Services

## Single Command to Start Everything

Run all services (Database, ML Service, Server, BVA Frontend, and Shopee Clone) with one command:

```bash
./start-all.sh
```

Or if you prefer npm:

```bash
npm run dev
```

## What Gets Started

The `start-all.sh` script will start:

1. **ML Service** (Python FastAPI)
   - Port: `8001`
   - API Docs: http://localhost:8001/docs
   - Health Check: http://localhost:8001/health

2. **Server** (Node.js/Express)
   - Port: `3000`
   - API: http://localhost:3000/api

3. **BVA Frontend** (React/Vite)
   - Port: `8080`
   - URL: http://localhost:8080

4. **Shopee Clone** (React/Vite)
   - Port: `5174`
   - URL: http://localhost:5174

## Prerequisites

Before running, ensure you have:

- **Node.js** (>=18.0.0)
- **npm** (>=9.0.0)
- **Python 3** (>=3.8)
- **PostgreSQL** running on port 5432 (or use Docker)
- **Redis** running on port 6379 (optional, for ML service)

## Using Docker for Database/Redis

If you don't have PostgreSQL/Redis installed locally, use Docker:

```bash
# Start only database services
docker-compose up -d postgres redis

# Or start everything with Docker
docker-compose up
```

## Alternative: Individual Service Commands

If you prefer to start services individually:

```bash
# Start ML Service
cd ml-service && ./start.sh

# Start Server (in another terminal)
cd server && npm run dev

# Start BVA Frontend (in another terminal)
cd bva-frontend && npm run dev

# Start Shopee Clone (in another terminal)
cd shopee-clone && npm run dev
```

## Troubleshooting

### Port Already in Use

If you get port conflicts:

- **Port 3000**: Change `PORT` in `server/.env`
- **Port 8080**: Change port in `bva-frontend/vite.config.ts`
- **Port 5174**: Change port in `shopee-clone/vite.config.ts`
- **Port 8001**: Change port in `ml-service/app/config.py`

### ML Service Not Starting

1. Ensure Python virtual environment exists:
   ```bash
   cd ml-service
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. Check ML service logs:
   ```bash
   tail -f ml-service.log
   ```

### Database Connection Issues

1. Ensure PostgreSQL is running:
   ```bash
   # Check if PostgreSQL is running
   docker ps | grep postgres
   # Or
   ps aux | grep postgres
   ```

2. Check database connection string in `server/.env`:
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/virtual_business_assistant
   ```

## Stopping Services

Press `Ctrl+C` in the terminal running `start-all.sh` to stop all services gracefully.

## Development Tips

- All services support hot-reload (auto-restart on file changes)
- Check individual service logs if something isn't working
- Use `npm run dev` in the root directory for a simpler start (requires all dependencies installed)

