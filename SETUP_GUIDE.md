# 🚀 Complete Setup Guide - Business Virtual Assistant (BVA)

This guide will walk you through setting up the entire BVA project from scratch, including all services and dependencies.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Environment Setup](#environment-setup)
4. [Database Setup](#database-setup)
5. [Backend Setup](#backend-setup)
6. [Frontend Setup](#frontend-setup)
7. [ML Service Setup](#ml-service-setup)
8. [Google OAuth Setup](#google-oauth-setup)
9. [Running the Project](#running-the-project)
10. [Verification & Testing](#verification--testing)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have the following installed:

### Required Software

- **Node.js** 18.0.0 or higher
  ```bash
  node --version  # Should be >= 18.0.0
  npm --version   # Should be >= 9.0.0
  ```

- **PostgreSQL** 12.0 or higher
  ```bash
  psql --version  # Should be >= 12.0
  ```

- **Python** 3.9 or higher (for ML service)
  ```bash
  python3 --version  # Should be >= 3.9
  ```

- **Git** (for cloning the repository)
  ```bash
  git --version
  ```

### Optional Software

- **Docker** and **Docker Compose** (for containerized deployment)
- **Redis** (for task queues and caching - optional but recommended)

---

## Project Structure

```
bva-server/
├── server/              # Backend API (Node.js/Express/TypeScript)
│   ├── src/
│   ├── prisma/
│   └── package.json
├── bva-frontend/        # Main frontend (React/Vite)
│   ├── src/
│   └── package.json
├── shopee-clone/        # Shopee clone frontend
│   ├── src/
│   └── package.json
├── ml-service/          # ML/AI service (Python/FastAPI)
│   ├── app/
│   ├── venv/
│   └── requirements.txt
├── package.json         # Root monorepo configuration
└── README.md
```

---

## Environment Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd bva-server
```

### 2. Create Environment Files

#### Backend Environment (`.env` in `server/` directory)

Create `server/.env`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/bva_db?schema=public"

# Server
PORT=3000
NODE_ENV=development

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRATION="24h"

# Google OAuth 2.0
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
BASE_URL="http://localhost:3000"

# Frontend URLs (for CORS and redirects)
FRONTEND_URL="http://localhost:8080"
VITE_API_URL="http://localhost:3000/api"

# ML Service
ML_SERVICE_URL="http://localhost:8001"

# Google Gemini AI (for ML service)
GEMINI_API_KEY="your-gemini-api-key"

# Redis (optional, for task queues)
REDIS_URL="redis://localhost:6379"

# CORS Origins (comma-separated)
CORS_ORIGINS="http://localhost:8080,http://localhost:5173,http://localhost:5174"
```

#### Frontend Environment (`.env` in `bva-frontend/` directory)

Create `bva-frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

#### ML Service Environment (`.env` in `ml-service/` directory)

Create `ml-service/.env`:

```env
# Server
PORT=8001
HOST=0.0.0.0

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Backend API (for callbacks)
BACKEND_URL=http://localhost:3000
```

---

## Database Setup

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE bva_db;

# Create user (optional, or use existing postgres user)
CREATE USER bva_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE bva_db TO bva_user;

# Exit psql
\q
```

### 2. Update Database URL

Update `DATABASE_URL` in `server/.env`:

```env
DATABASE_URL="postgresql://bva_user:your_password@localhost:5432/bva_db?schema=public"
```

### 3. Run Database Migrations

```bash
cd server

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed database with sample data
npm run seed
```

### 4. Verify Database Connection

```bash
# Open Prisma Studio to view database
npx prisma studio
```

This will open a browser at `http://localhost:5555` where you can view and edit your database.

---

## Backend Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Run Database Migrations

```bash
npx prisma migrate dev
```

### 4. (Optional) Seed Database

```bash
npm run seed
```

This will create:
- Sample users
- Sample shops
- Sample products
- Sample inventory
- Sample sales data

### 5. Verify Backend Setup

```bash
# Start the server
npm run dev
```

You should see:
```
✅ Server running on http://localhost:3000
✅ Database connected
✅ Google OAuth strategy initialized (if configured)
```

Test the API:
```bash
curl http://localhost:3000/api/health
```

---

## Frontend Setup

### 1. Install Dependencies

```bash
cd bva-frontend
npm install
```

### 2. Configure Environment

Ensure `bva-frontend/.env` exists with:
```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Verify Frontend Setup

```bash
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:8080/
➜  Network: use --host to expose
```

---

## ML Service Setup

### 1. Create Virtual Environment

```bash
cd ml-service

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate
```

### 2. Install Dependencies

```bash
# Ensure virtual environment is activated
pip install -r requirements.txt
```

### 3. Verify Installation

```bash
# Check if FastAPI app can be imported
python -c "from app.main import app; print('✅ App import successful')"
```

### 4. Start ML Service

**Option A: Using the provided script (Recommended)**

```bash
# Make script executable (Linux/Mac)
chmod +x run.sh

# Run the service
./run.sh
```

**Option B: Manual start**

```bash
# Activate virtual environment
source venv/bin/activate

# Start uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### 5. Verify ML Service

The service should start on `http://localhost:8001`

Test endpoints:
```bash
# Health check
curl http://localhost:8001/health

# API documentation
# Open http://localhost:8001/docs in browser
```

---

## Google OAuth Setup

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API** and **Google OAuth 2.0 API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen:
   - User Type: External (or Internal for G Suite)
   - App name: Business Virtual Assistant
   - Authorized domains: `localhost` (for development)
6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: BVA Development
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback`
     - `http://localhost:8080/api/auth/google/callback` (if needed)

### 2. Get Credentials

After creating, you'll receive:
- **Client ID**: `xxxxx.apps.googleusercontent.com`
- **Client Secret**: `xxxxx`

### 3. Update Environment Variables

Add to `server/.env`:
```env
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
BASE_URL="http://localhost:3000"
```

### 4. Verify OAuth Setup

Restart the backend server and check logs:
```
✅ Google OAuth strategy initialized
```

Test OAuth:
1. Go to `http://localhost:8080/login`
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Should redirect to dashboard

---

## Running the Project

### Option 1: Run All Services Together (Recommended)

From the root directory:

```bash
# Install all dependencies
npm install
npm run install:all

# Run all services
npm run dev
```

This will start:
- **Backend Server** on `http://localhost:3000`
- **BVA Frontend** on `http://localhost:8080`
- **Shopee Clone** on `http://localhost:5174`

**Note:** ML Service must be started separately (see ML Service Setup).

### Option 2: Run Services Individually

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - BVA Frontend:**
```bash
cd bva-frontend
npm run dev
```

**Terminal 3 - ML Service:**
```bash
cd ml-service
source venv/bin/activate
./run.sh
```

**Terminal 4 - Shopee Clone (Optional):**
```bash
cd shopee-clone
npm run dev
```

---

## Verification & Testing

### 1. Backend Health Check

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-..."
}
```

### 2. Frontend Access

Open browser:
- BVA Frontend: `http://localhost:8080`
- Shopee Clone: `http://localhost:5174`

### 3. ML Service Health Check

```bash
curl http://localhost:8001/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "ML Service"
}
```

### 4. Database Verification

```bash
cd server
npx prisma studio
```

Check for:
- Users table has data
- Shops table has data
- Products table has data

### 5. Test User Registration

1. Go to `http://localhost:8080/login`
2. Click "Register" tab
3. Fill in:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
4. Click "Register"
5. Should redirect to dashboard

### 6. Test Google OAuth

1. Go to `http://localhost:8080/login`
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Should redirect to dashboard with user data

### 7. Test ML Service Endpoints

```bash
# Test restock endpoint
curl -X POST http://localhost:8001/api/restock/plan \
  -H "Content-Type: application/json" \
  -d '{
    "shop_id": "your-shop-id",
    "budget": 50000,
    "goal": "balanced",
    "restock_days": 14
  }'
```

---

## Troubleshooting

### Database Connection Issues

**Problem:** `Error: P1001: Can't reach database server`

**Solutions:**
1. Check PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql  # Linux
   brew services list                # Mac
   ```

2. Verify DATABASE_URL in `server/.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/bva_db"
   ```

3. Test connection:
   ```bash
   psql -U postgres -d bva_db
   ```

### Port Already in Use

**Problem:** `Error: Port 3000 is already in use`

**Solutions:**
1. Find process using port:
   ```bash
   lsof -i :3000  # Mac/Linux
   netstat -ano | findstr :3000  # Windows
   ```

2. Kill process or change port in `.env`:
   ```env
   PORT=3001
   ```

### Prisma Migration Issues

**Problem:** `Error: Migration failed`

**Solutions:**
1. Reset database (⚠️ **WARNING:** Deletes all data):
   ```bash
   npx prisma migrate reset
   ```

2. Check for pending migrations:
   ```bash
   npx prisma migrate status
   ```

3. Create new migration:
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```

### Google OAuth Not Working

**Problem:** OAuth redirect fails or shows error

**Solutions:**
1. Verify credentials in `server/.env`:
   ```env
   GOOGLE_CLIENT_ID="correct-client-id"
   GOOGLE_CLIENT_SECRET="correct-secret"
   BASE_URL="http://localhost:3000"
   ```

2. Check authorized redirect URIs in Google Console:
   - Must include: `http://localhost:3000/api/auth/google/callback`

3. Check browser console for errors

4. Verify OAuth consent screen is configured

### ML Service Not Starting

**Problem:** `ERROR: Error loading ASGI app`

**Solutions:**
1. Use correct command:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
   ```
   **NOT:** `uvicorn app:main:app` (wrong syntax)

2. Verify virtual environment is activated:
   ```bash
   which python  # Should show venv path
   ```

3. Check dependencies:
   ```bash
   pip list | grep fastapi
   pip list | grep uvicorn
   ```

### Frontend API Errors

**Problem:** `Failed to fetch` or CORS errors

**Solutions:**
1. Verify `VITE_API_URL` in `bva-frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

2. Check backend CORS configuration in `server/src/app.ts`

3. Verify backend is running on correct port

4. Check browser console for specific error messages

### Module Not Found Errors

**Problem:** `Cannot find module` or import errors

**Solutions:**
1. Reinstall dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. For Prisma:
   ```bash
   npx prisma generate
   ```

3. For Python:
   ```bash
   pip install -r requirements.txt
   ```

### Authentication Issues

**Problem:** Login/Register not working

**Solutions:**
1. Check JWT_SECRET in `server/.env`:
   ```env
   JWT_SECRET="a-strong-secret-key"
   ```

2. Verify token in browser:
   ```javascript
   localStorage.getItem('auth_token')
   ```

3. Check backend logs for errors

4. Verify user exists in database:
   ```bash
   npx prisma studio
   ```

---

## Additional Resources

### Documentation Files

- `DEV_SETUP.md` - Development workflow
- `GOOGLE_OAUTH_FIX.md` - OAuth troubleshooting
- `OAUTH_INFINITE_LOOP_FIX.md` - OAuth navigation fixes
- `STATE_MANAGEMENT_FIX.md` - Frontend state management
- `ml-service/README.md` - ML service documentation
- `ml-service/QUICK_START.md` - ML service quick start

### Useful Commands

```bash
# Check database data
cd server
npx ts-node check_shop_data.ts

# Test API endpoints
cd server
npm run test

# View Prisma Studio
cd server
npx prisma studio

# Check ML service health
curl http://localhost:8001/health

# View logs
tail -f server.log  # If logging to file
```

### Getting Help

1. Check existing documentation files
2. Review error messages carefully
3. Check browser console and server logs
4. Verify environment variables
5. Test each service individually

---

## Next Steps

After setup is complete:

1. ✅ **Create your first user** via registration or Google OAuth
2. ✅ **Verify shop creation** - New sellers get shops automatically
3. ✅ **Test features:**
   - Dashboard analytics
   - Inventory management
   - SmartShelf analytics
   - Restock Planner
4. ✅ **Configure production environment** (when ready)
5. ✅ **Set up CI/CD** (optional)

---

**🎉 Congratulations! Your BVA project is now set up and ready for development!**

For questions or issues, refer to the troubleshooting section or check the project's issue tracker.

