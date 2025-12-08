# BVA Server - Complete Setup Guide

A comprehensive guide to set up and run the Business Virtual Assistant (BVA) platform on **Windows** and **Linux**.

> **📝 Environment Variables:** Complete `.env.example` files are provided in each service directory:
> - `server/.env.example` - Backend server configuration
> - `ml-service/.env.example` - ML service configuration  
> - `bva-frontend/.env.example` - Frontend configuration
> 
> Copy these files to `.env` and configure according to your setup. See the [Environment Variables](#environment-variables) section for details.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Windows Setup](#windows-setup)
- [Linux Setup](#linux-setup)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running Services](#running-services)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| **Node.js** | >= 18.0.0 | Backend server and frontend applications |
| **npm** | >= 9.0.0 | Package manager |
| **Python** | >= 3.9 | ML Service (FastAPI) |
| **PostgreSQL** | >= 14.0 | Database |
| **Git** | Latest | Version control |

### Optional but Recommended

- **Docker** & **Docker Compose** - For running PostgreSQL easily
- **Redis** | >= 6.0 | Caching (optional)

---

## Windows Setup

### Step 1: Install Node.js

1. Download Node.js LTS from [nodejs.org](https://nodejs.org/)
2. Run the installer and follow the setup wizard
3. Verify installation:
   ```powershell
   node --version
   npm --version
   ```

### Step 2: Install Python

1. Download Python from [python.org](https://www.python.org/downloads/)
2. **Important:** Check "Add Python to PATH" during installation
3. Choose Python 3.9 or higher
4. Verify installation:
   ```powershell
   python --version
   pip --version
   ```

### Step 3: Install PostgreSQL

**Option A: Using Installer**

1. Download PostgreSQL from [postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Run the installer
3. Remember the password you set for the `postgres` user
4. Keep default port `5432`
5. Verify installation:
   ```powershell
   psql --version
   ```

**Option B: Using Docker Desktop**

1. Install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
2. Start Docker Desktop
3. Navigate to project root and run:
   ```powershell
   docker-compose up -d postgres
   ```

### Step 4: Install Git

1. Download Git from [git-scm.com/download/win](https://git-scm.com/download/win)
2. Run the installer with default settings
3. Verify installation:
   ```powershell
   git --version
   ```

### Step 5: Clone and Setup Project

```powershell
# Clone the repository
git clone <repository-url>
cd bva-server

# Install all dependencies
npm run install:all

# Navigate to server directory and setup environment
cd server
copy .env.example .env

# ML Service environment
cd ..\ml-service
copy .env.example .env

# BVA Frontend environment (optional)
cd ..\bva-frontend
copy .env.example .env
```

### Step 6: Configure Environment Variables

**Edit `server/.env` file with your configuration:**

```env
# Database
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/bva_db?schema=public"

# Server
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000

# Frontend URL
FRONTEND_URL=http://localhost:8080

# JWT Secret (generate a random string using: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Google OAuth (Optional - for Google Sign-In)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Facebook OAuth (Optional - for Facebook Sign-In)
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# ML Service
ML_SERVICE_URL=http://localhost:8001

# Redis (Optional but Recommended)
REDIS_URL=redis://localhost:6379

# Supabase (Optional)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**Edit `ml-service/.env` file:**

```env
# Application
HOST=0.0.0.0
PORT=8001
DEBUG=false

# Redis
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1

# Model Configuration
MODEL_DIR=./models
DEFAULT_FORECAST_PERIODS=14

# Google Gemini API (for AI features)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp

# Backend API (Optional)
BACKEND_API_URL=http://localhost:3000
```

**Edit `bva-frontend/.env` file (optional):**

```env
# Backend API URL
VITE_API_URL=http://localhost:3000

# Supabase (Optional)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **Note:** See `.env.example` files in each directory for complete environment variable documentation.

### Step 7: Setup Database

```powershell
cd server

# Run database migrations
npx prisma migrate dev

# (Optional) Seed database
npx prisma db seed
```

### Step 8: Setup ML Service

```powershell
cd ml-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 9: Start All Services

**Option A: Using npm script (Recommended)**

```powershell
# From project root
npm start
```

**Option B: Start services individually**

```powershell
# Terminal 1: Start ML Service
cd ml-service
.\venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2: Start Backend Server
cd server
npm run dev

# Terminal 3: Start BVA Frontend
cd bva-frontend
npm run dev

# Terminal 4: Start Shopee Clone (optional)
cd shopee-clone
npm run dev
```

### Step 10: Access Services

Once all services are running:

- **BVA Frontend:** http://localhost:8080
- **Backend API:** http://localhost:3000/api
- **Shopee Clone:** http://localhost:5174
- **ML Service Docs:** http://localhost:8001/docs

---

## Linux Setup

### Step 1: Install Node.js

**Using NodeSource (Recommended)**

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

**Or using nvm (Alternative)**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

### Step 2: Install Python

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install python3 python3-pip python3-venv

# Verify installation
python3 --version
pip3 --version
```

### Step 3: Install PostgreSQL

**Using apt (Ubuntu/Debian)**

```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database user
sudo -u postgres psql
```

In PostgreSQL prompt:
```sql
CREATE DATABASE bva_db;
CREATE USER bva_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE bva_db TO bva_user;
\q
```

**Or using Docker**

```bash
docker-compose up -d postgres
```

### Step 4: Install Git

```bash
sudo apt-get install git
git --version
```

### Step 5: Clone and Setup Project

```bash
# Clone the repository
git clone <repository-url>
cd bva-server

# Install all dependencies
npm run install:all

# Navigate to server directory and setup environment
cd server
cp .env.example .env
# Edit .env file with your database credentials
nano .env  # or use your preferred editor
```

### Step 6: Configure Environment Variables

**Create environment files from examples:**

```powershell
# Server environment
cd server
copy .env.example .env

# ML Service environment
cd ..\ml-service
copy .env.example .env

# BVA Frontend environment (optional)
cd ..\bva-frontend
copy .env.example .env
```

**Edit `server/.env` file with your configuration:**

```env
# Database
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/bva_db?schema=public"

# Server
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000

# Frontend URL
FRONTEND_URL=http://localhost:8080

# JWT Secret (generate a random string using: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Google OAuth (Optional - for Google Sign-In)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Facebook OAuth (Optional - for Facebook Sign-In)
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# ML Service
ML_SERVICE_URL=http://localhost:8001

# Redis (Optional but Recommended)
REDIS_URL=redis://localhost:6379

# Supabase (Optional)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**Edit `ml-service/.env` file:**

```env
# Application
HOST=0.0.0.0
PORT=8001
DEBUG=false

# Redis
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1

# Model Configuration
MODEL_DIR=./models
DEFAULT_FORECAST_PERIODS=14

# Google Gemini API (for AI features)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp

# Backend API (Optional)
BACKEND_API_URL=http://localhost:3000
```

**Edit `bva-frontend/.env` file (optional):**

```env
# Backend API URL
VITE_API_URL=http://localhost:3000

# Supabase (Optional)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **Note:** See `.env.example` files in each directory for complete environment variable documentation.

### Step 7: Setup Database

```bash
cd server

# Run database migrations
npx prisma migrate dev

# (Optional) Seed database
npx prisma db seed
```

### Step 8: Setup ML Service

```bash
cd ml-service

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 9: Start All Services

**Option A: Using npm script (Recommended)**

```bash
# Make start script executable
chmod +x start-all.sh

# From project root
npm start
```

**Option B: Start services individually**

```bash
# Terminal 1: Start ML Service
cd ml-service
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2: Start Backend Server
cd server
npm run dev

# Terminal 3: Start BVA Frontend
cd bva-frontend
npm run dev

# Terminal 4: Start Shopee Clone (optional)
cd shopee-clone
npm run dev
```

### Step 10: Access Services

Once all services are running:

- **BVA Frontend:** http://localhost:8080
- **Backend API:** http://localhost:3000/api
- **Shopee Clone:** http://localhost:5174
- **ML Service Docs:** http://localhost:8001/docs

---

## Environment Variables

Complete `.env.example` files are provided in each service directory. Copy them to `.env` and fill in your values.

### Server Environment Variables (`server/.env`)

**Required Variables:**

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/bva_db?schema=public"

# Server Configuration
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000

# Frontend Configuration
FRONTEND_URL=http://localhost:8080

# Authentication
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
```

**Optional Variables:**

```env
# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# ML Service
ML_SERVICE_URL=http://localhost:8001

# Redis (Recommended for caching)
REDIS_URL=redis://localhost:6379

# Supabase (Optional)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

> **See `server/.env.example` for complete documentation of all available variables.**

### ML Service Environment Variables (`ml-service/.env`)

**Required Variables:**

```env
# Application Configuration
HOST=0.0.0.0
PORT=8001
DEBUG=false

# Redis Configuration
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1
```

**Optional Variables:**

```env
# Model Configuration
MODEL_DIR=./models
DEFAULT_FORECAST_PERIODS=14
DEFAULT_FORECAST_METHOD=auto

# Google Gemini API (for AI features)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp
IMAGEN_MODEL=gemini-2.5-flash-image

# Backend API (Optional)
BACKEND_API_URL=http://localhost:3000
BACKEND_API_KEY=your_backend_api_key

# Social Media APIs (Optional)
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json
```

> **See `ml-service/.env.example` for complete documentation of all available variables.**

### BVA Frontend Environment Variables (`bva-frontend/.env`)

**Optional Variables:**

```env
# Backend API URL
# In development, leave empty to use Vite proxy
# In production, set to your backend URL
VITE_API_URL=http://localhost:3000

# Supabase (Optional)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **See `bva-frontend/.env.example` for complete documentation of all available variables.**

---

## Database Setup

### Using Docker Compose (Recommended)

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Check if running
docker-compose ps
```

### Manual PostgreSQL Setup

**Windows:**
```powershell
# Start PostgreSQL service
net start postgresql-x64-14  # Version may vary

# Connect to PostgreSQL
psql -U postgres
```

**Linux:**
```bash
# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Connect to PostgreSQL
sudo -u postgres psql
```

### Run Migrations

```bash
cd server
npx prisma migrate dev
npx prisma generate
```

### View Database (Prisma Studio)

```bash
cd server
npx prisma studio
```

Access at: http://localhost:5555

---

## Running Services

### Start All Services

```bash
# From project root
npm start
```

This will start:
- ML Service on port 8001
- Backend Server on port 3000
- BVA Frontend on port 8080
- Shopee Clone on port 5174

### Start Services Individually

```bash
# Backend Server
cd server && npm run dev

# BVA Frontend
cd bva-frontend && npm run dev

# Shopee Clone
cd shopee-clone && npm run dev

# ML Service
cd ml-service
source venv/bin/activate  # Linux
# or
.\venv\Scripts\activate    # Windows
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Build for Production

```bash
# Build all services
npm run build

# Build individual services
npm run build:server
npm run build:frontend
npm run build:shopee
```

---

## Troubleshooting

### Port Already in Use

**Windows:**
```powershell
# Find process using port
netstat -ano | findstr :3000

# Kill process
taskkill /PID <process_id> /F
```

**Linux:**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Issues

1. Verify PostgreSQL is running:
   ```bash
   # Windows
   net start postgresql-x64-14
   
   # Linux
   sudo systemctl status postgresql
   ```

2. Check `DATABASE_URL` in `server/.env`
3. Verify database exists:
   ```bash
   psql -U postgres -l
   ```

### ML Service Not Starting

1. Verify Python virtual environment is activated
2. Check all dependencies are installed:
   ```bash
   pip install -r requirements.txt
   ```
3. Verify port 8001 is available

### CORS Issues

1. Verify `FRONTEND_URL` in `server/.env` matches your frontend URL
2. Check backend CORS configuration

### Module Not Found Errors

```bash
# Reinstall all dependencies
npm run install:all

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Prisma Issues

```bash
cd server

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

---

## Additional Resources

- **Backend API Docs:** http://localhost:3000/api/docs
- **ML Service Docs:** http://localhost:8001/docs
- **Prisma Studio:** Run `npx prisma studio` in `server/` directory

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review service logs
3. Check GitHub issues
4. Contact the development team

---

**Last Updated:** 2024
