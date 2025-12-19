# BVA Server - Complete Setup Guide

A comprehensive guide to set up and run the Business Virtual Assistant (BVA) platform on **Windows 10/11** and **Linux**.

> **📝 Environment Variables:** Complete `.env.example` files are provided in each service directory. Copy them to `.env` and configure according to your setup.

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
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
- [Project Structure](#project-structure)
- [Available Services](#available-services)
- [Environment Variables Reference](#environment-variables-reference)
- [Running Services](#running-services)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Version | Purpose | Download Link |
|----------|---------|---------|---------------|
| **Node.js** | >= 18.0.0 | Backend server and frontend | [nodejs.org](https://nodejs.org/) |
| **Python** | >= 3.9 | ML Service (FastAPI) | [python.org](https://www.python.org/downloads/) |
| **PostgreSQL** | >= 14.0 | Database | [postgresql.org](https://www.postgresql.org/download/) |
| **Git** | Latest | Version control | [git-scm.com](https://git-scm.com/download/) |

### Optional but Recommended

- **Docker Desktop** - For running PostgreSQL easily ([docker.com](https://www.docker.com/products/docker-desktop/))
- **Redis** >= 6.0 - For caching (optional)
- **Visual Studio Code** - Recommended IDE ([code.visualstudio.com](https://code.visualstudio.com/))
- **Windows Terminal** - Better terminal experience (Windows) ([Microsoft Store](https://aka.ms/terminal))

### System Requirements

- **OS:** Windows 10 (version 1809 or higher), Windows 11, or Linux (Ubuntu 20.04+, Debian 11+)
- **RAM:** Minimum 4GB, Recommended 8GB+
- **Disk Space:** Minimum 5GB free space

---

## Quick Start

For experienced developers, here's the quick setup:

```bash
# Clone repository
git clone https://github.com/MarcZxc1/bva-server.git
cd bva-server

# Install all dependencies
npm run install:all

# Setup environment files
cd server && cp .env.example .env
cd ../ml-service && cp .env.example .env
cd ../bva-frontend && cp .env.example .env
cd ..

# Edit .env files with your configuration (see Environment Variables section)

# Setup database
cd server
npx prisma generate
npx prisma migrate dev

# Setup ML service
cd ../ml-service
python3 -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt

# Start all services
cd ..
npm start
```

---

## Step-by-Step Installation

### 1. Install Node.js

**Windows:**

1. Visit [nodejs.org](https://nodejs.org/) and download the **LTS version**
2. Run the installer (`node-v18.x.x-x64.msi`)
3. During installation:
   - ✅ Accept the license agreement
   - ✅ Keep default installation path
   - ✅ **Check "Automatically install the necessary tools"** (optional but recommended)
   - ✅ Click "Install"

**Linux (Ubuntu/Debian):**

```bash
# Using NodeSource (Recommended)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or using nvm (Alternative)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

**Verify Installation:**

```bash
node --version  # Should output: v18.x.x or higher
npm --version   # Should output: 9.x.x or higher
```

### 2. Install Python

**Windows:**

1. Visit [python.org/downloads](https://www.python.org/downloads/) and download **Python 3.9** or higher
2. Run the installer (`python-3.x.x-amd64.exe`)
3. During installation:
   - ✅ **IMPORTANT:** Check **"Add Python to PATH"** at the bottom
   - ✅ Click "Install Now"
   - ✅ Click "Disable path length limit" when prompted (recommended)

**Linux:**

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install python3 python3-pip python3-venv

# Verify installation
python3 --version
pip3 --version
```

**Verify Installation:**

```bash
python --version  # Windows
python3 --version # Linux
# Should output: Python 3.9.x or higher
```

### 3. Install PostgreSQL

**Option A: Using PostgreSQL Installer (Recommended for Beginners)**

**Windows:**

1. Download from [postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Run the installer (`postgresql-14.x-x-windows-x64.exe`)
3. During installation:
   - ✅ Keep default installation directory
   - ✅ Select components: PostgreSQL Server, pgAdmin 4, Command Line Tools
   - ✅ Keep default data directory
   - ✅ **Set password for 'postgres' user** (remember this password!)
   - ✅ Keep port as `5432`
   - ✅ Keep default locale

**Linux:**

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Create Database:**

```bash
# Windows: Open psql (enter your postgres password when prompted)
psql -U postgres

# Linux: Use sudo
sudo -u postgres psql
```

In PostgreSQL prompt:
```sql
CREATE DATABASE bva_db;
CREATE USER bva_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE bva_db TO bva_user;
\q
```

**Option B: Using Docker Desktop (Recommended for Developers)**

1. Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Start Docker Desktop
3. Navigate to project root and run:
   ```bash
   docker-compose up -d postgres
   ```

**Verify Installation:**

```bash
psql --version
# Should output: psql (PostgreSQL) 14.x or higher
```

### 4. Install Git

**Windows:**

1. Download from [git-scm.com/download/win](https://git-scm.com/download/win)
2. Run the installer with default settings
3. Recommended settings:
   - ✅ Default editor: Use Visual Studio Code (if installed) or Vim
   - ✅ Branch name: "Let Git decide"
   - ✅ PATH: "Git from the command line and also from 3rd-party software"

**Linux:**

```bash
sudo apt-get install git
git --version
```

### 5. Clone and Setup Project

**Clone Repository:**

```bash
# Navigate to your preferred directory
cd ~/Documents  # Linux
cd C:\Users\YourUsername\Documents  # Windows

# Clone the repository
git clone https://github.com/MarcZxc1/bva-server.git
cd bva-server
```

**Install All Dependencies:**

```bash
npm run install:all
```

> **⏱️ Note:** This may take 5-10 minutes depending on your internet connection.

**Create Environment Files:**

**Windows:**
```powershell
cd server
copy .env.example .env

cd ..\ml-service
copy .env.example .env

cd ..\bva-frontend
copy .env.example .env

cd ..
```

**Linux:**
```bash
cd server
cp .env.example .env

cd ../ml-service
cp .env.example .env

cd ../bva-frontend
cp .env.example .env

cd ..
```

### 6. Configure Environment Variables

#### Server Environment Variables (`server/.env`)

**Required Variables:**

```env
# Database Configuration
DATABASE_URL="postgresql://bva_user:your_password@localhost:5432/bva_db?schema=public"

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
# OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# ML Service
ML_SERVICE_URL=http://localhost:8001

# Redis (Recommended for caching)
REDIS_URL=redis://localhost:6379
```

> **💡 Tip:** Generate a secure JWT secret:
> ```bash
> # Linux/Mac
> openssl rand -base64 32
> 
> # Windows (PowerShell)
> [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
> ```

#### ML Service Environment Variables (`ml-service/.env`)

**Required Variables:**

```env
# Application
HOST=0.0.0.0
PORT=8001
DEBUG=false

# Redis (Optional but Recommended)
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1

# Model Configuration
MODEL_DIR=./models
DEFAULT_FORECAST_PERIODS=14

# Google Gemini API (for AI features)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp

# Backend API
BACKEND_API_URL=http://localhost:3000
```

> **💡 Tip:** Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

#### BVA Frontend Environment Variables (`bva-frontend/.env`)

**Required Variables:**

```env
# Backend API URL
VITE_API_URL=http://localhost:3000
```

> **Note:** See `.env.example` files in each directory for complete environment variable documentation.

### 7. Setup Database

```bash
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
> ```bash
> npx prisma studio
> ```
> This opens a web interface at http://localhost:5555

### 8. Setup ML Service

```bash
cd ml-service

# Create Python virtual environment
python3 -m venv venv  # Windows: python -m venv venv

# Activate virtual environment
source venv/bin/activate  # Windows: .\venv\Scripts\activate

# Upgrade pip (recommended)
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
```

**Verify Installation:**

```bash
python --version
pip list  # Should show installed packages
```

### 9. Start All Services

**Option A: Start All Services at Once (Recommended)**

From the project root directory:

**Windows:**
```powershell
npm start
```

**Linux:**
```bash
chmod +x start-all.sh
npm start
```

This will automatically start all services in the correct order:
- ML Service on port 8001
- Backend Server on port 3000
- BVA Frontend on port 8080
- Shopee Clone on port 5174
- Lazada Clone on port 3001

**Option B: Start Services Individually (Advanced)**

Open separate terminal windows:

**Terminal 1 - ML Service:**
```bash
cd ml-service
source venv/bin/activate  # Windows: .\venv\Scripts\activate
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

**Terminal 4 - Shopee Clone (Optional):**
```bash
cd shopee-clone
npm run dev
```

**Terminal 5 - Lazada Clone (Optional):**
```bash
cd lazada-clone
npm run dev
```

---

## Project Structure

```
bva-server/
├── server/              # Backend API (Node.js/Express/TypeScript)
│   ├── src/            # Source code
│   ├── prisma/         # Database schema and migrations
│   └── .env            # Environment variables
├── bva-frontend/        # Main frontend application (React/Vite)
│   ├── src/            # Source code
│   └── .env            # Environment variables
├── ml-service/          # Machine Learning service (Python/FastAPI)
│   ├── app/            # Source code
│   ├── venv/           # Python virtual environment
│   └── .env            # Environment variables
├── shopee-clone/        # Shopee marketplace clone
│   ├── src/            # Source code
│   └── .env            # Environment variables (optional)
├── lazada-clone/        # Lazada marketplace clone (Next.js)
│   ├── src/            # Source code
│   └── .env            # Environment variables (optional)
└── shopee-auth/         # Shopee authentication service
```

---

## Available Services

Once all services are running, access:

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

## Running Services

### Daily Usage

After initial setup, you only need to start the services:

```bash
# Navigate to project root
cd bva-server

# Start all services
npm start
```

### Stopping Services

Press `Ctrl + C` in the terminal to stop all services gracefully.

### Individual Service Commands

```bash
# Start only backend server
npm run dev:server

# Start only BVA frontend
npm run dev:frontend

# Start only Shopee clone
npm run dev:shopee

# Start only Lazada clone
npm run dev:lazada

# Start all Node.js services (without ML service)
npm run dev
```

### Build for Production

```bash
# Build all services
npm run build

# Or build individual services
npm run build:server
npm run build:frontend
npm run build:shopee
npm run build:lazada
```

---

## Troubleshooting

### Common Issues and Solutions

#### 🔴 "Port Already in Use" Error

**Problem:** Port 3000, 8080, 8001, 5174, or 3001 is already being used.

**Solution:**

**Windows:**
```powershell
# Find process using the port (example: port 3000)
netstat -ano | findstr :3000

# Kill the process (replace <PID> with the number from previous command)
taskkill /PID <PID> /F

# Or find and kill all Node processes
taskkill /F /IM node.exe
```

**Linux:**
```bash
# Find process using the port
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### 🔴 Database Connection Failed

**Problem:** Cannot connect to PostgreSQL database.

**Solutions:**

1. **Check if PostgreSQL is running:**
   ```bash
   # Windows
   net start postgresql-x64-14
   
   # Linux
   sudo systemctl status postgresql
   ```

2. **Verify DATABASE_URL in `server/.env`:**
   ```env
   DATABASE_URL="postgresql://bva_user:your_password@localhost:5432/bva_db?schema=public"
   ```

3. **Test database connection:**
   ```bash
   psql -U bva_user -d bva_db
   ```

4. **If database doesn't exist, create it:**
   ```bash
   psql -U postgres
   # Then in psql:
   CREATE DATABASE bva_db;
   CREATE USER bva_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE bva_db TO bva_user;
   \q
   ```

#### 🔴 ML Service Not Starting

**Problem:** ML Service fails to start or shows import errors.

**Solutions:**

1. **Verify virtual environment is activated:**
   ```bash
   cd ml-service
   source venv/bin/activate  # Windows: .\venv\Scripts\activate
   # You should see (venv) in your prompt
   ```

2. **Reinstall dependencies:**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. **Check Python version:**
   ```bash
   python --version  # Should be 3.9 or higher
   ```

#### 🔴 Prisma/Database Issues

**Problem:** Database schema issues or migrations failing.

**Solutions:**

```bash
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

#### 🔴 CORS Errors in Browser

**Problem:** Frontend can't communicate with backend.

**Solutions:**

1. **Check `FRONTEND_URL` in `server/.env`:**
   ```env
   FRONTEND_URL=http://localhost:8080
   ```

2. **Make sure frontend is running on port 8080**

3. **Clear browser cache and restart services**

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

#### 🔴 Windows: Script Execution Issues

**Problem:** `npm start` fails on Windows due to shell script.

**Solutions:**

1. **Use Git Bash** (comes with Git for Windows):
   ```bash
   # Right-click in project folder > Git Bash Here
   npm start
   ```

2. **Use WSL (Windows Subsystem for Linux):**
   ```bash
   wsl
   cd /mnt/c/Users/YourUsername/Documents/bva-server
   npm start
   ```

3. **Modify root `package.json`** to use Windows-compatible commands (see Windows Setup section in original SETUP.md if needed)

#### 🔴 Module Not Found Errors

**Problem:** Missing dependencies or incorrect paths.

**Solutions:**

```bash
# Reinstall all dependencies
npm run install:all

# Or for a specific service
cd server
rm -rf node_modules package-lock.json  # Linux
# Windows: Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

---

## Additional Resources

- **📖 README:** [README.md](./README.md) - Project overview
- **🏗️ Architecture:** [ARCHITECTURE_GUIDE.md](./ARCHITECTURE_GUIDE.md) - Technical architecture guide
- **🔧 Backend API Docs:** http://localhost:3000/api/docs (if available)
- **🤖 ML Service Docs:** http://localhost:8001/docs
- **🗄️ Database Management:** `npx prisma studio` in `server/` directory
- **🐙 GitHub Repository:** https://github.com/MarcZxc1/bva-server

---

## Quick Commands Reference

```bash
# Start all services
npm start

# Install dependencies
npm run install:all

# View database
cd server && npx prisma studio

# Check service status
# Windows
netstat -ano | findstr :3000   # Backend
netstat -ano | findstr :8080   # Frontend
netstat -ano | findstr :8001   # ML Service

# Linux
lsof -i :3000   # Backend
lsof -i :8080   # Frontend
lsof -i :8001   # ML Service

# Clear cache and restart
# Windows
Remove-Item -Recurse -Force node_modules, package-lock.json
npm run install:all

# Linux
rm -rf node_modules package-lock.json
npm run install:all
```

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintained by:** BVA Development Team
