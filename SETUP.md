# BVA Server - Setup Guide

A comprehensive guide to set up and run the Business Virtual Assistant (BVA) platform on **Windows 10/11** and **Linux**.

> **📝 Environment Variables:** Complete `.env.example` files are provided in each service directory:
> - `server/.env.example` - Backend server configuration
> - `ml-service/.env.example` - ML service configuration  
> - `bva-frontend/.env.example` - Frontend configuration
> 
> Copy these files to `.env` and configure according to your setup. See the [Environment Variables](#environment-variables) section for details.

---

## 🪟 Windows Setup - Important Package.json Changes

**⚠️ IMPORTANT:** Before starting the project on Windows, you need to make the following changes to ensure compatibility:

### 1. Root `package.json` - Fix Start Script

The root `package.json` uses a shell script (`./start-all.sh`) which doesn't work on Windows. You have two options:

**Option A: Use npm script directly (Recommended for Windows)**

Edit `/package.json` and change the `start` script:

```json
{
  "scripts": {
    "start": "concurrently -n \"ML,SERVER,FRONTEND,SHOPEE\" -c \"red,blue,green,yellow\" \"cd ml-service && .\\venv\\Scripts\\activate && uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload\" \"npm run dev:server\" \"npm run dev:frontend\" \"npm run dev:shopee\""
  }
}
```

**Option B: Create a Windows batch file**

Create `start-all.bat` in the root directory:

```batch
@echo off
start "ML Service" cmd /k "cd ml-service && venv\Scripts\activate && uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload"
start "Backend Server" cmd /k "cd server && npm run dev"
start "BVA Frontend" cmd /k "cd bva-frontend && npm run dev"
start "Shopee Clone" cmd /k "cd shopee-clone && npm run dev"
```

Then change `package.json`:
```json
{
  "scripts": {
    "start": "start-all.bat"
  }
}
```

### 2. `server/package.json` - Fix Build Script for Windows

The build script uses Unix `cp` command. Change it to be cross-platform:

**Current (Unix-only):**
```json
{
  "scripts": {
    "build": "tsc && cp -r src/generated dist/generated"
  }
}
```

**Windows-Compatible (Option A - Using npm package):**
```json
{
  "scripts": {
    "build": "tsc && npm run copy:generated",
    "copy:generated": "node -e \"require('fs').cpSync('src/generated', 'dist/generated', {recursive: true, force: true})\""
  }
}
```

**Windows-Compatible (Option B - Using xcopy on Windows, cp on Linux):**
```json
{
  "scripts": {
    "build": "tsc && npm run copy:generated",
    "copy:generated": "node scripts/copy-generated.js"
  }
}
```

Create `server/scripts/copy-generated.js`:
```javascript
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../src/generated');
const dest = path.join(__dirname, '../dist/generated');

if (fs.existsSync(src)) {
  fs.cpSync(src, dest, { recursive: true, force: true });
  console.log('✅ Copied generated files to dist/');
} else {
  console.log('⚠️  No generated files to copy');
}
```

**Windows-Compatible (Option C - Simplest, using cross-platform tool):**

Install `cpy-cli`:
```powershell
cd server
npm install --save-dev cpy-cli
```

Then update `package.json`:
```json
{
  "scripts": {
    "build": "tsc && cpy src/generated/** dist/generated"
  }
}
```

### 3. Alternative: Use Git Bash or WSL

If you prefer not to modify the scripts, you can use:
- **Git Bash** (comes with Git for Windows) - supports Unix commands
- **Windows Subsystem for Linux (WSL)** - full Linux environment on Windows

To use Git Bash:
```powershell
# Right-click in project folder > Git Bash Here
npm start
```

---

## 📋 Quick Start for Windows

1. **Make the package.json changes above** (especially the root `package.json` start script)
2. **Install prerequisites** (Node.js, Python, PostgreSQL, Git)
3. **Clone and setup:**
   ```powershell
   git clone https://github.com/MarcZxc1/bva-server.git
   cd bva-server
   npm run install:all
   ```
4. **Configure environment variables** (see [Step 6](#6-configure-environment-variables))
5. **Setup database** (see [Step 7](#7-setup-database))
6. **Setup ML service** (see [Step 8](#8-setup-ml-service))
7. **Start services:**
   ```powershell
   npm start
   ```

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Step-by-Step Installation](#step-by-step-installation)
  - [1. Install Node.js](#1-install-nodejs)
  - [2. Install Python](#2-install-python)
  - [3. Install PostgreSQL](#3-install-postgresql)
  - [4. Install Git](#4-install-git)
  - [5. Clone and Setup Project](#5-clone-and-setup-project)
  - [6. Configure Environment Variables](#6-configure-environment-variables)
  - [7. Setup Database](#7-setup-database)
  - [8. Setup ML Service](#8-setup-ml-service)
  - [9. Start All Services](#9-start-all-services)
- [Environment Variables Reference](#environment-variables-reference)
- [Running Services](#running-services)
- [Troubleshooting](#troubleshooting)
- [Linux Setup (Quick Reference)](#linux-setup-quick-reference)

---

## Prerequisites

Before starting, ensure you have administrator access to your Windows machine.

### Required Software

| Software | Version | Purpose | Download Link |
|----------|---------|---------|---------------|
| **Node.js** | >= 18.0.0 | Backend server and frontend | [nodejs.org](https://nodejs.org/) |
| **Python** | >= 3.9 | ML Service (FastAPI) | [python.org](https://www.python.org/downloads/) |
| **PostgreSQL** | >= 14.0 | Database | [postgresql.org](https://www.postgresql.org/download/windows/) |
| **Git** | Latest | Version control | [git-scm.com](https://git-scm.com/download/win) |

### Optional but Recommended

- **Docker Desktop** - For running PostgreSQL easily ([docker.com](https://www.docker.com/products/docker-desktop/))
- **Redis** >= 6.0 - For caching (optional)
- **Visual Studio Code** - Recommended IDE ([code.visualstudio.com](https://code.visualstudio.com/))
- **Windows Terminal** - Better terminal experience ([Microsoft Store](https://aka.ms/terminal))

### System Requirements

- **OS:** Windows 10 (version 1809 or higher) or Windows 11
**Download and Install:**

1. Visit [nodejs.org](https://nodejs.org/) and download the **LTS version** (recommended)
2. Run the installer (`node-v18.x.x-x64.msi`)
3. During installation:
   - ✅ Accept the license agreement
   - ✅ Keep default installation path
   - ✅ **Check "Automatically install the necessary tools"** (optional but recommended)
   - ✅ Click "Install"

**Verify Installation:**

Open **PowerShell** or **Command Prompt** and run:

```powershell
node --version
# Should output: v18.x.x or higher

npm --version
# Should output: 9.x.x or higher
**Download and Install:**

1. Visit [python.org/downloads](https://www.python.org/downloads/) and download **Python 3.9** or higher
2. Run the installer (`python-3.x.x-amd64.exe`)
3. During installation:
   - ✅ **IMPORTANT:** Check **"Add Python to PATH"** at the bottom
   - ✅ Click "Install Now"
   - ✅ Click "Disable path length limit" when prompted (recommended)

**Verify Installation:**

You have **two options** for installing PostgreSQL:

#### **Option A: Using PostgreSQL Installer (Recommended for Beginners)**

1. Download from [postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Run the installer (`postgresql-14.x-x-windows-x64.exe`)
3. During installation:
   - ✅ Keep default installation directory
   - ✅ Select components: PostgreSQL Server, pgAdmin 4, Command Line Tools
   - ✅ Keep default data directory
   - ✅ **Set password for 'postgres' user** (remember this password!)
   - ✅ Keep port as `5432`
   - ✅ Keep default locale
4. Complete the installation and **uncheck** "Launch Stack Builder" (optional)

**Verify Installation:**

```powershell
psql --version
# Should output: psql (PostgreSQL) 14.x or higher
```

**Create Database:**

```powershell
# Open psql (enter your postgres password when prompted)
psql -U postgres

# In psql prompt:
CREATE DATABASE bva_db;
CREATE USER bva_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE bva_db TO bva_user;
\q
```

#### **Option B: Using Docker Desktop (Recommended for Developers)**

1. Download and install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
2. Start Docker Desktop (wait for it to fully start)
3. Enable WSL 2 if prompted
**Download and Install:**

1. Download from [git-scm.com/download/win](https://git-scm.com/download/win)
2. Run the installer (`Git-2.x.x-64-bit.exe`)
3. During installation (recommended settings):
   - ✅ Keep default components
   - ✅ Default editor: Use Visual Studio Code (if installed) or Vim
   - ✅ Branch name: "Let Git decide"
   - ✅ PATH: "Git from the command line and also from 3rd-party software"
**Clone Repository:**

Open PowerShell or Command Prompt and navigate to where you want to store the project:

```powershell
# Navigate to your preferred directory
cd C:\Users\YourUsername\Documents

# Clone the repository
git clone https://github.com/MarcZxc1/bva-server.git
cd bva-server
```

**Install All Dependencies:**

This will install dependencies for all services (server, frontend, shopee-clone, lazada-clone):

```powershell
npm run install:all
```

> **⏱️ Note:** This may take 5-10 minutes depending on your internet connection.

**Create Environment Files:**

```powershell
# Create environment files from examples
cd server
copy .env.example .env

cd ..\ml-service
copy .env.example .env

cd ..\bva-frontend
copy .env.example .env

cd ..
```

---

### 6. Configure Environment Variables
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

```

**Edit `ml-service/.env` file:**
Navigate to the server directory and setup the database:

```powershell
cd server

# Generate Prisma Client
npx prisma generate

# Run database migrations (creates tables)
npx prisma migrate dev --name init

# Optional: Seed database with sample data
npx prisma db seed
```

**Expected Output:**
```
✔ Generated Prisma Client
✔ The migration has been generated and applied
✔ Seeding complete
```

> **💡 Tip:** View your database using Prisma Studio:
> ```powershell
> npx prisma studio
> ```
> This opens a web interface at http://localhost:5555

Navigate to the ML service directory and setup Python environment:

```powershell
cd ..\ml-service

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Upgrade pip (recommended)
python -m pip install --upgrade pip

# Install dependencies
You have **two options** to start the services:

#### **Option A: Start All Services at Once (Recommended)**

From the project root directory:

```powershell
cd C:\Users\YourUsername\Documents\bva-server
npm start
```

This will automatically start all services in the correct order.

#### **Option B: Start Services Individually (Advanced)**

Open **4 separate** PowerShell/Command Prompt windows:

**Terminal 1 - ML Service:**
```powershell
cd C:\Users\YourUsername\Documents\bva-server\ml-service
.\venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 - Backend Server:**
```powershell
cd C:\Users\YourUsername\Documents\bva-server\server
npm run dev
```

**Terminal 3 - BVA Frontend:**
```powershell
cd C:\Users\YourUsername\Documents\bva-server\bva-frontend
npm run dev
```

**Terminal 4 - Shopee Clone (Optional):**
```powershell
cd C:\Users\YourUsername\Documents\bva-server\shopee-clone
npm run dev
```

**Wait for all services to start** (you'll see "Server running" messages).

---

### 10. Access Services

# Run database migrations
npx prisma migrate dev
Once all services are running successfully, open your web browser and access:

| Service | URL | Description |
|---------|-----|-------------|
| **🎯 BVA Frontend** | http://localhost:8080 | Main application interface |
| **🔧 Backend API** | http://localhost:3000/api | REST API endpoints |
| **🏪 Shopee Clone** | http://localhost:5174 | Shopee marketplace clone |
| **🛍️ Lazada Clone** | http://localhost:3001 | Lazada marketplace clone |
| **🤖 ML Service Docs** | http://localhost:8001/docs | FastAPI interactive documentation |
| **🗄️ Prisma Studio** | http://localhost:5555 | Database management (run `npx prisma studio` in server/) |

> **✅ Success Check:** If you can access the BVA Frontend at http://localhost:8080 and see the login page, your setup is complete!

---

## Environment Variables Reference
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
Complete `.env.example` files are provided in each service directory. Copy them to `.env` and fill in your values.

### Server Environment Variables (`server/.env`)
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

```

> **See `server/.env.example` for complete documentation of all available variables.**

### ML Service Environment Variables (`ml-service/.env`)

**Required Variables:**

*See `bva-frontend/.env.example` for complete documentation of all available variables.**

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
## Running Services

### Daily Usage

After initial setup, you only need to start the services:

```powershell
# Navigate to project root
cd C:\Users\YourUsername\Documents\bva-server

# Start all services
npm start
```

### Stopping Services

Press `Ctrl + C` in each terminal window to stop services gracefully.

### Build for Production

```powershell
# Build all services for production
npm run build

# Or build individual services
npm run build:server
npm run build:frontend
npm run build:shopee
npm run build:lazada
```

---f -i :3000

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

## Troubleshooting

### Common Issues and Solutions

#### 🔴 "Port Already in Use" Error

**Problem:** Port 3000, 8080, or 8001 is already being used.

**Solution:**

```powershell
# Find process using the port (example: port 3000)
netstat -ano | findstr :3000

# Kill the process (replace <PID> with the number from previous command)
taskkill /PID <PID> /F

# Or find and kill all Node processes
taskkill /F /IM node.exe

# Or find and kill Python processes
taskkill /F /IM python.exe
```

---

#### 🔴 Database Connection Failed

**Problem:** Cannot connect to PostgreSQL database.

**Solutions:**

1. **Check if PostgreSQL is running:**
   ```powershell
   # Start PostgreSQL service (adjust version number)
   net start postgresql-x64-14
   ```

2. **Verify DATABASE_URL in `server/.env`:**
   ```env
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/bva_db?schema=public"
   ```

3. **Test database connection:**
   ```powershell
   psql -U postgres -d bva_db
   ```

4. **If database doesn't exist, create it:**
   ```powershell
   psql -U postgres
   # Then in psql:
   CREATE DATABASE bva_db;
   \q
   ```

---

#### 🔴 ML Service Not Starting

**Problem:** ML Service fails to start or shows import errors.

**Solutions:**

1. **Verify virtual environment is activated:**
   ```powershell
   cd ml-service
   .\venv\Scripts\activate
   # You should see (venv) in your prompt
   ```

2. **Reinstall dependencies:**
   ```powershell
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. **Check Python version:**
   ```powershell
### Getting Help

If you're still experiencing issues:

1. **Check the logs:** Look at the terminal output for error messages
2. **Review `.env` files:** Make sure all required variables are set
3. **GitHub Issues:** Check existing issues or create a new one
4. **Documentation:** Review the README.md for additional information

---

## Linux Setup (Quick Reference)

For Linux users, here's a quick setup reference:

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python
sudo apt-get install python3 python3-pip python3-venv

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Clone and setup
git clone https://github.com/MarcZxc1/bva-server.git
cd bva-server
npm run install:all

# Setup environments
cd server && cp .env.example .env
cd ../ml-service && cp .env.example .env

# Setup database
cd ../server
npx prisma generate
npx prisma migrate dev

# Setup ML service
cd ../ml-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start all services
cd ..
npm start
```

---

## Additional Resources

- **📖 README:** [README.md](./README.md) - Project overview
- **🔧 Backend API Docs:** http://localhost:3000/api/docs
- **🤖 ML Service Docs:** http://localhost:8001/docs
- **🗄️ Database Management:** `npx prisma studio` in `server/` directory
- **🐙 GitHub Repository:** https://github.com/MarcZxc1/bva-server

---

## Quick Commands Reference

```powershell
# Start all services
npm start

# Install dependencies
npm run install:all

# View database
cd server && npx prisma studio

# Check service status
netstat -ano | findstr :3000   # Backend
netstat -ano | findstr :8080   # Frontend
netstat -ano | findstr :8001   # ML Service

# Clear cache and restart
Remove-Item -Recurse -Force node_modules, package-lock.json
npm run install:all
```

---

**Last Updated:** December 15, 2025
**Version:** 1.0.0
**Maintained by:** BVA Development TeamForce node_modules, package-lock.json
npm run install:all

# Or for a specific service
cd server
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

---

#### 🔴 Prisma/Database Issues

**Problem:** Database schema issues or migrations failing.

**Solutions:**

```powershell
cd server

# Generate Prisma Client
npx prisma generate

# Apply migrations
npx prisma migrate dev

# Reset database (⚠️ WARNING: Deletes all data)
npx prisma migrate reset

# View database in browser
npx prisma studio
```

---

#### 🔴 CORS Errors in Browser

**Problem:** Frontend can't communicate with backend.

**Solutions:**

1. **Check `FRONTEND_URL` in `server/.env`:**
   ```env
   FRONTEND_URL=http://localhost:8080
   ```

2. **Make sure frontend is running on port 8080**

3. **Clear browser cache and restart services**

---

#### 🔴 "npm ERR! ENOENT" or File Not Found

**Problem:** Missing files or incorrect paths.

**Solutions:**

```powershell
# Make sure you're in the project root
cd C:\Users\YourUsername\Documents\bva-server

# Check current directory
Get-Location

# List files
dir
```

---

#### 🔴 Windows Firewall Blocking Connections

**Problem:** Services can't communicate due to Windows Firewall.

**Solutions:**

1. When Windows Firewall prompt appears, click **"Allow access"**
2. Or manually add rules in Windows Defender Firewall settings
3. For development, you can temporarily disable firewall (not recommended for production)

---

#### 🔴 Gemini API Key Invalid

**Problem:** ML Service can't access Google Gemini API.

**Solutions:**

1. **Get a valid API key:**
   - Visit https://makersuite.google.com/app/apikey
   - Sign in with Google account
   - Create a new API key

2. **Update `ml-service/.env`:**
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Restart ML Service**

---

#### 🔴 Git Clone Fails

**Problem:** Can't clone repository due to authentication.

**Solutions:**

```powershell
# Use HTTPS with personal access token
git clone https://github.com/MarcZxc1/bva-server.git

# Or configure SSH keys
# See: https://docs.github.com/en/authentication/connecting-to-github-with-ssh
```