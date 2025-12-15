# BVA Project - Deployment Guide (Free Tiers)

This guide will help you deploy your entire BVA project using **100% free tier services**.

## 📋 Table of Contents
1. [Deployment Architecture](#deployment-architecture)
2. [Prerequisites](#prerequisites)
3. [Database Setup (Neon)](#1-database-setup-neon)
4. [Redis Setup (Upstash)](#2-redis-setup-upstash)
5. [Backend Server (Render)](#3-backend-server-render)
6. [ML Service (Render)](#4-ml-service-render)
7. [Frontend Apps (Vercel)](#5-frontend-apps-vercel)
8. [Post-Deployment](#6-post-deployment)
9. [Troubleshooting](#troubleshooting)

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│  FRONTEND LAYER (Vercel - Free)                 │
│  ├── BVA Dashboard (bva-frontend)               │
│  ├── Shopee Clone (shopee-clone)                │
│  ├── Lazada Clone (lazada-clone)                │
│  └── TikTok Seller Clone (tiktokseller-clone)   │
└─────────────────────────────────────────────────┘
                      ↓ HTTPS
┌─────────────────────────────────────────────────┐
│  BACKEND LAYER (Render - Free)                  │
│  ├── Main Server (Node.js/Express) [750hrs/mo]  │
│  └── ML Service (Python/FastAPI) [750hrs/mo]    │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  DATA LAYER                                     │
│  ├── PostgreSQL (Neon - Free Forever)           │
│  │   └── 3GB Storage, Unlimited Queries         │
│  └── Redis (Upstash - Free)                     │
│      └── 10K commands/day                       │
└─────────────────────────────────────────────────┘
```

---

## Prerequisites

Before starting, you'll need accounts on:
- ✅ [Neon](https://neon.tech) - PostgreSQL database
- ✅ [Upstash](https://upstash.com) - Redis cache
- ✅ [Render](https://render.com) - Backend hosting
- ✅ [Vercel](https://vercel.com) - Frontend hosting
- ✅ [GitHub](https://github.com) - Your code repository

**Note**: Make sure all your code is pushed to GitHub before proceeding.

---

## 1. Database Setup (Neon)

### Step 1.1: Create Neon Account & Project
1. Go to https://neon.tech and sign up (free, no credit card required)
2. Click **"Create a project"**
3. Name your project: `bva-production`
4. Select region closest to your users (e.g., `US East (Ohio)`)
5. Click **"Create project"**

### Step 1.2: Get Database Connection String
1. In your Neon dashboard, go to **"Connection Details"**
2. Copy the **"Connection string"** (it looks like this):
   ```
   postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
3. **SAVE THIS** - you'll need it for backend deployment

### Step 1.3: Configure Database
Neon automatically creates a database called `neondb`. That's perfect for our use!

**Features you get (Free tier):**
- ✅ 3GB storage
- ✅ Unlimited queries
- ✅ Connection pooling
- ✅ Automatic backups
- ✅ No expiration

---

## 2. Redis Setup (Upstash)

### Step 2.1: Create Upstash Account & Database
1. Go to https://upstash.com and sign up (free, no credit card required)
2. Click **"Create database"**
3. Name: `bva-redis-cache`
4. Type: **Redis**
5. Region: Choose same region as your Neon database
6. Click **"Create"**

### Step 2.2: Get Redis Connection Details
1. In your Redis database dashboard, go to **"Details"**
2. Copy these values:
   - **UPSTASH_REDIS_REST_URL**: `https://xxx.upstash.io`
   - **UPSTASH_REDIS_REST_TOKEN**: `your-token-here`
3. **SAVE THESE** - you'll need them for deployment

**Features you get (Free tier):**
- ✅ 10,000 commands/day
- ✅ 256MB storage
- ✅ Global replication
- ✅ TLS/SSL enabled

---

## 3. Backend Server (Render)

### Step 3.1: Prepare for Deployment
Before deploying, ensure your `server/` directory has:
- ✅ `package.json` with build scripts
- ✅ `tsconfig.json`
- ✅ `prisma/schema.prisma`

### Step 3.2: Create Web Service on Render
1. Go to https://render.com and sign up
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `bva-server`
4. Configure the service:

   **Basic Settings:**
   - **Name**: `bva-backend`
   - **Region**: Same as your database
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: 
     ```bash
     npm install --no-audit --no-fund && npx prisma generate && npm run build
     ```
   - **Start Command**: 
     ```bash
     npx prisma migrate deploy && npm start
     ```
   - **Instance Type**: `Free`

### Step 3.3: Add Environment Variables
In Render's **"Environment"** section, add these variables:

```env
# Database
DATABASE_URL=<your-neon-connection-string>

# Server
NODE_ENV=production
PORT=10000
BASE_URL=https://bva-backend.onrender.com
BACKEND_URL=https://bva-backend.onrender.com

# Frontend URLs (update after deploying frontend)
FRONTEND_URL=https://your-bva-app.vercel.app

# Security
JWT_SECRET=<generate-random-string-here>
JWT_EXPIRES_IN=7d

# ML Service URL (update after deploying ML service)
ML_SERVICE_URL=https://bva-ml-service.onrender.com

# Redis (Upstash)
REDIS_URL=<your-upstash-redis-url>

# OAuth (optional - add if you have them)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Gemini API (for AI features)
GEMINI_API_KEY=your_gemini_api_key
```

**To generate JWT_SECRET:**
```bash
openssl rand -base64 32
# or online: https://generate-random.org/api-key-generator
```

### Step 3.4: Deploy
1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. Your backend URL will be: `https://bva-backend.onrender.com`

---

## 4. ML Service (Render)

### Step 4.1: Create Python Web Service
1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Select your GitHub repository: `bva-server`
3. Configure:

   **Basic Settings:**
   - **Name**: `bva-ml-service`
   - **Region**: Same as backend
   - **Branch**: `main`
   - **Root Directory**: `ml-service`
   - **Runtime**: `Python 3`
   - **Build Command**: 
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command**: 
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type**: `Free`

### Step 4.2: Add Environment Variables
```env
# Application
APP_NAME=SmartShelf ML Service
PORT=10000
HOST=0.0.0.0
DEBUG=false

# Redis (Upstash)
REDIS_URL=<your-upstash-redis-url>
CELERY_BROKER_URL=<your-upstash-redis-url>
CELERY_RESULT_BACKEND=<your-upstash-redis-url>

# Model
MODEL_DIR=/opt/render/project/src/models

# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# API Config
API_V1_PREFIX=/api/v1
```

### Step 4.3: Deploy
1. Click **"Create Web Service"**
2. Wait 5-10 minutes
3. Your ML service URL: `https://bva-ml-service.onrender.com`

### Step 4.4: Update Backend Environment
Go back to your backend service and update:
```env
ML_SERVICE_URL=https://bva-ml-service.onrender.com
```
Then trigger a redeploy.

---

## 5. Frontend Apps (Vercel)

Deploy each frontend app separately on Vercel.

### 5.1: BVA Dashboard Frontend

1. Go to https://vercel.com and sign up
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository: `bva-server`
4. Configure:

   **Project Settings:**
   - **Project Name**: `bva-dashboard`
   - **Framework Preset**: `Vite`
   - **Root Directory**: `bva-frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

   **Environment Variables:**
   ```env
   VITE_API_URL=https://bva-backend.onrender.com
   VITE_ENABLE_ANALYTICS=true
   VITE_ENABLE_REALTIME=true
   ```

5. Click **"Deploy"**
6. Your URL: `https://bva-dashboard.vercel.app`

### 5.2: Shopee Clone

1. Click **"Add New..."** → **"Project"**
2. Select `bva-server` repository
3. Configure:
   - **Project Name**: `shopee-clone`
   - **Framework**: `Vite`
   - **Root Directory**: `shopee-clone`
   - **Environment Variables:**
     ```env
     VITE_API_URL=http://localhost:3002
     VITE_BVA_API_URL=https://bva-backend.onrender.com
     ```
4. Deploy

### 5.3: Lazada Clone

1. Click **"Add New..."** → **"Project"**
2. Select `bva-server` repository
3. Configure:
   - **Project Name**: `lazada-clone`
   - **Framework**: `Next.js`
   - **Root Directory**: `lazada-clone`
   - **Environment Variables:**
     ```env
     NEXT_PUBLIC_API_URL=http://localhost:3003
     NEXT_PUBLIC_BVA_API_URL=https://bva-backend.onrender.com
     ```
4. Deploy

### 5.4: TikTok Seller Clone

1. Click **"Add New..."** → **"Project"**
2. Select `bva-server` repository
3. Configure:
   - **Project Name**: `tiktokseller-clone`
   - **Framework**: `Vite`
   - **Root Directory**: `tiktokseller-clone`
   - **Environment Variables:**
     ```env
     VITE_API_URL=http://localhost:3004
     VITE_BVA_API_URL=https://bva-backend.onrender.com
     ```
4. Deploy

---

## 6. Post-Deployment

### 6.1: Update Backend FRONTEND_URL
1. Go to your backend service on Render
2. Update environment variable:
   ```env
   FRONTEND_URL=https://bva-dashboard.vercel.app
   ```
3. Add CORS origins (comma-separated):
   ```env
   CORS_ORIGINS=https://bva-dashboard.vercel.app,https://shopee-clone.vercel.app,https://lazada-clone.vercel.app,https://tiktokseller-clone.vercel.app
   ```
4. Save and redeploy

### 6.2: Test Your Deployment

**Backend Health Check:**
```bash
curl https://bva-backend.onrender.com/health
# Should return: {"status":"ok"}
```

**ML Service Health Check:**
```bash
curl https://bva-ml-service.onrender.com/api/v1/health
# Should return: {"status":"healthy"}
```

**Frontend Access:**
- Open `https://bva-dashboard.vercel.app`
- Test login/signup
- Check all features

### 6.3: Run Database Migrations
Your backend automatically runs migrations on startup, but you can manually trigger:

1. Go to Render backend dashboard
2. Click **"Shell"**
3. Run:
   ```bash
   npx prisma migrate deploy
   ```

---

## Troubleshooting

### Issue: "Database connection failed"
**Solution:**
- Verify DATABASE_URL is correct in Render environment
- Check Neon database is running (should be always on)
- Ensure connection string includes `?sslmode=require`

### Issue: "Redis connection timeout"
**Solution:**
- Use Upstash REST API instead of native Redis
- Update Redis client configuration for serverless
- Check REDIS_URL format

### Issue: "Build failed - Module not found"
**Solution:**
- Check `package.json` has all dependencies
- Ensure `Root Directory` is set correctly
- Clear build cache and redeploy

### Issue: "Cold starts / Slow response"
**Solution:**
- This is normal for Render free tier (services sleep after 15min)
- First request may take 30-60 seconds to wake up
- Consider upgrading to paid tier ($7/mo) for always-on

### Issue: "CORS errors in frontend"
**Solution:**
- Add all frontend URLs to CORS_ORIGINS in backend
- Ensure FRONTEND_URL is set correctly
- Check browser console for exact origin error

### Issue: "Prisma migrations not applied"
**Solution:**
- Run manually: `npx prisma migrate deploy`
- Ensure DATABASE_URL has `?sslmode=require`
- Check Render logs for migration errors

---

## 🎯 Cost Summary (Monthly)

| Service | Plan | Cost | Limits |
|---------|------|------|--------|
| **Neon** | Free | $0 | 3GB storage, unlimited queries |
| **Upstash** | Free | $0 | 10K commands/day |
| **Render** (Backend) | Free | $0 | 750 hours/mo (sleeps after 15min) |
| **Render** (ML) | Free | $0 | 750 hours/mo (sleeps after 15min) |
| **Vercel** (×4 apps) | Free | $0 | Unlimited bandwidth |
| **Total** | | **$0/mo** | Perfect for development/testing |

---

## 🚀 Next Steps

After successful deployment:
1. ✅ Set up custom domains (optional)
2. ✅ Configure OAuth providers
3. ✅ Set up monitoring (Render built-in)
4. ✅ Enable SSL certificates (automatic on Vercel/Render)
5. ✅ Add environment-specific configs
6. ✅ Set up CI/CD pipeline (GitHub Actions)

---

## 📞 Support

If you encounter issues:
1. Check Render logs (real-time in dashboard)
2. Review Vercel deployment logs
3. Test API endpoints directly with curl
4. Check database connections in Neon dashboard

**Need help?** Open an issue on GitHub!
