# BVA Server - Complete Setup Guide

A comprehensive guide to set up and run the Business Virtual Assistant (BVA) platform, including all services, databases, and integrations.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running Services](#running-services)
- [Port Configuration](#port-configuration)
- [Troubleshooting](#troubleshooting)
- [Development Workflow](#development-workflow)

---

## Prerequisites

Before starting, ensure you have the following installed:

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| **Node.js** | >= 18.0.0 | Backend server and frontend applications |
| **npm** | >= 9.0.0 | Package manager |
| **Python** | >= 3.9 | ML Service (FastAPI) |
| **PostgreSQL** | >= 14.0 | Database |
| **Redis** | >= 6.0 | Caching (optional but recommended) |
| **Git** | Latest | Version control |

### Optional but Recommended

- **Docker** & **Docker Compose** - For running PostgreSQL and Redis easily
- **VS Code** or **WebStorm** - For development
- **Postman** or **Insomnia** - For API testing

---

## Quick Start

### Option 1: One-Command Start (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd bva-server

# Install all dependencies
npm run install:all

# Start all services (Database, ML Service, Server, Frontends)
npm start
# or
./start-all.sh
```

This will start:
- ✅ PostgreSQL (via Docker or local)
- ✅ Redis (via Docker or local)
- ✅ ML Service on `http://localhost:8001`
- ✅ Backend Server on `http://localhost:3000`
- ✅ BVA Frontend on `http://localhost:8080`
- ✅ Shopee Clone on `http://localhost:5173`

### Option 2: Manual Setup

Follow the [Detailed Setup](#detailed-setup) section below.

---

## Detailed Setup

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd bva-server
```

### Step 2: Install Dependencies

#### Root Dependencies

```bash
npm install
```

#### Install All Workspace Dependencies

```bash
npm run install:all
```

This installs dependencies for:
- `server/` - Backend API
- `bva-frontend/` - BVA Dashboard
- `shopee-clone/` - Shopee Clone Frontend

### Step 3: Database Setup

#### Using Docker (Recommended)

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Verify they're running
docker ps
```

#### Manual PostgreSQL Setup

1. Install PostgreSQL:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   
   # macOS
   brew install postgresql
   brew services start postgresql
   
   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

2. Create database:
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create database
   CREATE DATABASE virtual_business_assistant;
   
   # Exit
   \q
   ```

### Step 4: Environment Variables

#### Backend Server (`server/.env`)

Create `server/.env` file:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/virtual_business_assistant"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRATION="24h"

# Server Configuration
PORT=3000
NODE_ENV=development
BASE_URL="http://localhost:3000"
BACKEND_URL="http://localhost:3000"

# Frontend URLs (for CORS and OAuth redirects)
FRONTEND_URL="http://localhost:8080"
VITE_API_URL="http://localhost:3000/api"

# Google OAuth 2.0
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# ML Service
ML_SERVICE_URL="http://localhost:8001"

# Redis (optional, for caching)
REDIS_URL="redis://localhost:6379"
```

#### ML Service (`ml-service/.env`)

Create `ml-service/.env` file:

```env
# Google Gemini API
GEMINI_API_KEY="your-google-gemini-api-key"

# ML Service Configuration
ML_SERVICE_PORT=8001
ML_SERVICE_HOST="0.0.0.0"

# Model Configuration
GEMINI_MODEL="gemini-2.0-flash-exp"
IMAGEN_MODEL="gemini-2.5-flash-image"

# Redis (optional)
REDIS_URL="redis://localhost:6379"
```

#### Frontend (`bva-frontend/.env`)

Create `bva-frontend/.env` file:

```env
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

#### Shopee Clone (`shopee-clone/.env`)

Create `shopee-clone/.env` file (optional):

```env
VITE_API_URL=http://localhost:3000/api
```

### Step 5: Database Migration

```bash
cd server

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) View database in Prisma Studio
npx prisma studio
```

### Step 6: ML Service Setup

```bash
cd ml-service

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 7: Start Services

#### Option A: Start All at Once

```bash
# From root directory
npm start
# or
./start-all.sh
```

#### Option B: Start Individually

**Terminal 1 - ML Service:**
```bash
cd ml-service
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 - Backend Server:**
```bash
cd server
npm run dev
```

**Terminal 3 - BVA Frontend:**
```bash
cd bva-frontend
npm run dev
```

**Terminal 4 - Shopee Clone:**
```bash
cd shopee-clone
npm run dev
```

---

## Environment Variables

### Required Environment Variables

#### Backend Server (`server/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/dbname` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key` |
| `JWT_EXPIRATION` | JWT token expiration time | `24h` |
| `PORT` | Server port | `3000` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | From Google Cloud Console |
| `ML_SERVICE_URL` | ML Service API URL | `http://localhost:8001` |

#### ML Service (`ml-service/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | From Google AI Studio |
| `ML_SERVICE_PORT` | ML Service port | `8001` |

### Optional Environment Variables

- `REDIS_URL` - Redis connection string (for caching)
- `NODE_ENV` - Environment mode (`development` or `production`)
- `FRONTEND_URL` - Frontend URL for CORS and OAuth redirects

---

## Database Setup

### Initial Setup

```bash
cd server

# Generate Prisma Client
npx prisma generate

# Create database schema
npx prisma migrate dev --name init

# (Optional) Seed database (if seed script exists)
# npm run seed
```

### View Database

```bash
# Open Prisma Studio (GUI)
npx prisma studio

# Or use PostgreSQL CLI
psql -U postgres -d virtual_business_assistant
```

### Clear Database

```bash
# Clear all data
npm run db:clear

# Or manually via Prisma Studio
npx prisma studio
```

### Database Schema

The database includes the following main models:
- `User` - User accounts (buyers, sellers, admins)
- `Shop` - Seller shops
- `Product` - Products listed by sellers
- `Sale` - Sales/orders
- `Inventory` - Inventory tracking
- `Campaign` - Marketing campaigns
- `Integration` - Platform integrations
- `Notification` - User notifications

---

## Running Services

### Available Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start all services using `start-all.sh` |
| `npm run dev` | Start all Node.js services (Server, Frontends) |
| `npm run dev:server` | Start only backend server |
| `npm run dev:frontend` | Start only BVA frontend |
| `npm run dev:shopee` | Start only Shopee Clone |
| `npm run build` | Build all services for production |
| `npm run install:all` | Install dependencies for all workspaces |

### Service URLs

Once all services are running:

| Service | URL | Description |
|---------|-----|-------------|
| **Backend API** | http://localhost:3000 | REST API |
| **API Docs** | http://localhost:3000/api | API endpoints |
| **BVA Frontend** | http://localhost:8080 | Business dashboard |
| **Shopee Clone** | http://localhost:5173 | E-commerce frontend |
| **ML Service** | http://localhost:8001 | ML/AI service |
| **ML Docs** | http://localhost:8001/docs | FastAPI Swagger UI |
| **Prisma Studio** | http://localhost:5555 | Database GUI (run `npx prisma studio`) |

---

## Port Configuration

### Default Ports

| Service | Port | Config File |
|---------|------|-------------|
| Backend Server | 3000 | `server/.env` |
| BVA Frontend | 8080 | `bva-frontend/vite.config.ts` |
| Shopee Clone | 5173 | `shopee-clone/vite.config.ts` |
| ML Service | 8001 | `ml-service/app/config.py` |
| PostgreSQL | 5432 | `docker-compose.yml` |
| Redis | 6379 | `docker-compose.yml` |

### Changing Ports

**Backend Server:**
```env
# server/.env
PORT=3000
```

**BVA Frontend:**
```typescript
// bva-frontend/vite.config.ts
export default {
  server: {
    port: 8080
  }
}
```

**Shopee Clone:**
```typescript
// shopee-clone/vite.config.ts
export default {
  server: {
    port: 5173
  }
}
```

**ML Service:**
```python
# ml-service/app/config.py
ML_SERVICE_PORT = 8001
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find process using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or change port in config
```

#### 2. Database Connection Failed

**Error:** `Can't reach database server`

**Solution:**
```bash
# Check PostgreSQL is running
docker ps | grep postgres
# or
ps aux | grep postgres

# Verify DATABASE_URL in server/.env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/virtual_business_assistant"

# Test connection
psql -U postgres -d virtual_business_assistant
```

#### 3. ML Service Not Starting

**Error:** `ModuleNotFoundError` or Python errors

**Solution:**
```bash
cd ml-service

# Ensure virtual environment is activated
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate  # Windows

# Reinstall dependencies
pip install -r requirements.txt

# Check Python version
python --version  # Should be >= 3.9
```

#### 4. Prisma Client Not Generated

**Error:** `@prisma/client did not initialize yet`

**Solution:**
```bash
cd server
npx prisma generate
```

#### 5. CORS Errors

**Error:** `Access to fetch at 'http://localhost:3000' from origin 'http://localhost:8080' has been blocked by CORS policy`

**Solution:**
- Verify `FRONTEND_URL` in `server/.env` matches your frontend URL
- Check CORS configuration in `server/src/app.ts`

#### 6. Google OAuth Not Working

**Error:** `redirect_uri_mismatch`

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Edit your OAuth 2.0 Client ID
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback`
   - `http://localhost:8080/login`
   - `http://localhost:5173/login`

#### 7. Missing Environment Variables

**Error:** `process.env.GEMINI_API_KEY is undefined`

**Solution:**
- Create `.env` files in each service directory
- Copy `.env.example` if available
- Verify variable names match exactly

### Getting Help

1. **Check Logs:**
   ```bash
   # Server logs
   tail -f server.log
   
   # ML Service logs
   tail -f ml-service.log
   ```

2. **Verify Services:**
   ```bash
   # Check all services are running
   curl http://localhost:3000/health
   curl http://localhost:8001/health
   ```

3. **Database Issues:**
   ```bash
   # Reset database
   cd server
   npx prisma migrate reset
   npx prisma migrate dev
   ```

---

## Development Workflow

### Daily Development

1. **Start Services:**
   ```bash
   npm start
   ```

2. **Make Changes:**
   - All services support hot-reload
   - Changes auto-refresh in browser

3. **Test Changes:**
   - Frontend: http://localhost:8080 (BVA) or http://localhost:5173 (Shopee)
   - API: http://localhost:3000/api
   - ML Service: http://localhost:8001/docs

### Database Changes

```bash
cd server

# Create migration
npx prisma migrate dev --name your-migration-name

# Apply migration
npx prisma migrate deploy

# View database
npx prisma studio
```

### Adding Dependencies

```bash
# Backend
cd server
npm install <package>

# Frontend
cd bva-frontend
npm install <package>

# Shopee Clone
cd shopee-clone
npm install <package>

# ML Service
cd ml-service
source venv/bin/activate
pip install <package>
pip freeze > requirements.txt
```

### Code Quality

```bash
# Lint code (if configured)
npm run lint

# Format code (if configured)
npm run format

# Type check
npm run type-check
```

---

## Project Structure

```
bva-server/
├── server/                 # Backend API (Node.js/Express/TypeScript)
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── services/      # Business logic
│   │   ├── routes/        # API routes
│   │   ├── middlewares/   # Express middlewares
│   │   └── lib/           # Utilities
│   ├── prisma/            # Database schema and migrations
│   └── .env               # Environment variables
│
├── bva-frontend/          # BVA Dashboard (React/Vite)
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── services/      # API clients
│   │   └── hooks/         # React hooks
│   └── .env               # Environment variables
│
├── shopee-clone/          # Shopee Clone Frontend (React/Vite)
│   ├── src/
│   │   ├── features/      # Feature modules
│   │   ├── components/    # Reusable components
│   │   └── services/      # API clients
│   └── .env               # Environment variables
│
├── ml-service/            # ML/AI Service (Python/FastAPI)
│   ├── app/
│   │   ├── routes/        # API routes
│   │   ├── services/      # ML services
│   │   └── models/        # ML models
│   ├── venv/              # Python virtual environment
│   └── .env               # Environment variables
│
├── docker-compose.yml     # Docker services (PostgreSQL, Redis)
├── start-all.sh           # Start all services script
└── package.json           # Root package.json with workspaces
```

---

## Next Steps

After setup:

1. **Configure Google OAuth:**
   - Get credentials from [Google Cloud Console](https://console.cloud.google.com/)
   - Add to `server/.env` and `bva-frontend/.env`

2. **Get Gemini API Key:**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Add to `ml-service/.env`

3. **Create First User:**
   - Sign up at http://localhost:8080 or http://localhost:5173
   - Or use Google OAuth

4. **Explore Features:**
   - BVA Dashboard: http://localhost:8080
   - Shopee Clone: http://localhost:5173
   - API Documentation: http://localhost:3000/api
   - ML Service Docs: http://localhost:8001/docs

---

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Google Gemini API](https://ai.google.dev/docs)

---

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review service logs
3. Check GitHub Issues
4. Contact the development team

---

**Last Updated:** 2025-01-XX
**Version:** 1.0.0

