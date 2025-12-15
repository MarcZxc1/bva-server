# 🚀 Quick Deployment Checklist

Use this checklist to deploy your BVA project step-by-step.

## Pre-Deployment ✅

- [ ] All code committed to Git
- [ ] Code pushed to GitHub
- [ ] Run `./check-deployment-readiness.sh` (all checks pass)
- [ ] Read `DEPLOYMENT_GUIDE.md`

## 1. Database Setup (Neon) 🗄️

- [ ] Create Neon account at https://neon.tech
- [ ] Create new project: `bva-production`
- [ ] Copy connection string (starts with `postgresql://`)
- [ ] Save connection string securely
- [ ] Test connection with: `psql <connection-string>`

**Connection String Format:**
```
postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

## 2. Redis Setup (Upstash) 💾

- [ ] Create Upstash account at https://upstash.com
- [ ] Create Redis database: `bva-redis-cache`
- [ ] Copy REST URL and Token
- [ ] Save credentials securely

**You'll need:**
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## 3. API Keys Setup 🔑

- [ ] Get Gemini API key from https://aistudio.google.com/app/apikey
- [ ] Generate JWT secret: `openssl rand -base64 32`
- [ ] (Optional) Configure Google OAuth credentials
- [ ] (Optional) Configure Facebook OAuth credentials

## 4. Backend Deployment (Render) 🖥️

- [ ] Create Render account at https://render.com
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub repository
- [ ] Configure service:
  - Name: `bva-backend`
  - Root Directory: `server`
  - Build: `npm install && npx prisma generate && npm run build`
  - Start: `npx prisma migrate deploy && npm start`
- [ ] Add environment variables (see DEPLOYMENT_GUIDE.md)
- [ ] Click "Create Web Service"
- [ ] Wait for deployment (~5-10 minutes)
- [ ] Test: `curl https://bva-backend.onrender.com/health`
- [ ] Copy backend URL: `https://bva-backend.onrender.com`

## 5. ML Service Deployment (Render) 🤖

- [ ] In Render, click "New +" → "Web Service"
- [ ] Connect same GitHub repository
- [ ] Configure service:
  - Name: `bva-ml-service`
  - Root Directory: `ml-service`
  - Build: `pip install -r requirements.txt`
  - Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] Add environment variables
- [ ] Deploy
- [ ] Test: `curl https://bva-ml-service.onrender.com/api/v1/health`
- [ ] Copy ML service URL: `https://bva-ml-service.onrender.com`

## 6. Update Backend with ML URL 🔄

- [ ] Go back to backend service on Render
- [ ] Update environment variable:
  ```
  ML_SERVICE_URL=https://bva-ml-service.onrender.com
  ```
- [ ] Trigger manual deploy

## 7. BVA Frontend (Vercel) 🎨

- [ ] Create Vercel account at https://vercel.com
- [ ] Click "Add New..." → "Project"
- [ ] Import GitHub repository: `bva-server`
- [ ] Configure:
  - Project Name: `bva-dashboard`
  - Framework: `Vite`
  - Root Directory: `bva-frontend`
- [ ] Add environment variable:
  ```
  VITE_API_URL=https://bva-backend.onrender.com
  ```
- [ ] Deploy
- [ ] Copy frontend URL: `https://bva-dashboard.vercel.app`

## 8. Shopee Clone (Vercel) 🛍️

- [ ] In Vercel, "Add New..." → "Project"
- [ ] Select same repository
- [ ] Configure:
  - Project Name: `shopee-clone`
  - Root Directory: `shopee-clone`
- [ ] Add environment variables:
  ```
  VITE_API_URL=http://localhost:3002
  VITE_BVA_API_URL=https://bva-backend.onrender.com
  ```
- [ ] Deploy
- [ ] Copy URL: `https://shopee-clone.vercel.app`

## 9. Lazada Clone (Vercel) 🛒

- [ ] In Vercel, "Add New..." → "Project"
- [ ] Configure:
  - Project Name: `lazada-clone`
  - Framework: `Next.js`
  - Root Directory: `lazada-clone`
- [ ] Add environment variables:
  ```
  NEXT_PUBLIC_API_URL=http://localhost:3003
  NEXT_PUBLIC_BVA_API_URL=https://bva-backend.onrender.com
  ```
- [ ] Deploy
- [ ] Copy URL: `https://lazada-clone.vercel.app`

## 10. TikTok Seller Clone (Vercel) 📱

- [ ] In Vercel, "Add New..." → "Project"
- [ ] Configure:
  - Project Name: `tiktokseller-clone`
  - Root Directory: `tiktokseller-clone`
- [ ] Add environment variables:
  ```
  VITE_API_URL=http://localhost:3004
  VITE_BVA_API_URL=https://bva-backend.onrender.com
  ```
- [ ] Deploy
- [ ] Copy URL: `https://tiktokseller-clone.vercel.app`

## 11. Update Backend CORS 🔐

- [ ] Go to backend service on Render
- [ ] Update environment variables:
  ```
  FRONTEND_URL=https://bva-dashboard.vercel.app
  CORS_ORIGINS=https://bva-dashboard.vercel.app,https://shopee-clone.vercel.app,https://lazada-clone.vercel.app,https://tiktokseller-clone.vercel.app
  ```
- [ ] Trigger manual deploy

## 12. Testing 🧪

### Backend Health Check
- [ ] Test: `curl https://bva-backend.onrender.com/health`
- [ ] Expected: `{"status":"ok"}`

### ML Service Health Check
- [ ] Test: `curl https://bva-ml-service.onrender.com/api/v1/health`
- [ ] Expected: `{"status":"healthy"}`

### Frontend Access
- [ ] Open BVA Dashboard: `https://bva-dashboard.vercel.app`
- [ ] Test user registration
- [ ] Test user login
- [ ] Check dashboard loads
- [ ] Test product features
- [ ] Check SmartShelf functionality

### Platform Clones
- [ ] Open Shopee Clone
- [ ] Test seller registration
- [ ] Test product creation
- [ ] Verify webhook to BVA
- [ ] Repeat for Lazada and TikTok clones

## 13. Database Migration ✓

- [ ] Go to Render backend shell
- [ ] Run: `npx prisma migrate deploy`
- [ ] Verify: `npx prisma studio` (in local dev)
- [ ] Check tables created

## 14. Documentation 📝

- [ ] Document all URLs in a secure location:
  - Backend URL
  - ML Service URL
  - Frontend URLs (4 apps)
  - Database connection string
  - Redis credentials
- [ ] Save all environment variables securely
- [ ] Share access with team (if applicable)

## Post-Deployment 🎉

- [ ] Set up monitoring (Render provides built-in)
- [ ] Configure custom domains (optional)
- [ ] Set up SSL certificates (automatic on Vercel/Render)
- [ ] Enable GitHub auto-deploy (already configured)
- [ ] Test all features end-to-end
- [ ] Monitor logs for errors

## Troubleshooting 🔧

If something doesn't work:

1. **Check Render Logs**
   - Go to service → Logs tab
   - Look for error messages

2. **Check Vercel Logs**
   - Go to deployment → Function logs
   - Check build logs

3. **Test API Endpoints**
   ```bash
   curl https://bva-backend.onrender.com/health
   curl https://bva-ml-service.onrender.com/api/v1/health
   ```

4. **Verify Environment Variables**
   - All services have correct URLs
   - Database connection string is valid
   - Redis credentials are correct

5. **Check Database Connection**
   - Use Neon dashboard
   - Check connection pooling
   - Verify SSL mode

## Cost Summary 💰

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| Neon PostgreSQL | $0 | Free forever (3GB) |
| Upstash Redis | $0 | 10K commands/day |
| Render (2 services) | $0 | 750 hours each |
| Vercel (4 apps) | $0 | Unlimited bandwidth |
| **Total** | **$0/month** | Perfect for MVP! |

---

## ✅ Deployment Complete!

Congratulations! Your BVA project is now live in production! 🎉

**Your URLs:**
- 🏠 Dashboard: `https://bva-dashboard.vercel.app`
- 🛍️ Shopee: `https://shopee-clone.vercel.app`
- 🛒 Lazada: `https://lazada-clone.vercel.app`
- 📱 TikTok: `https://tiktokseller-clone.vercel.app`

**Next Steps:**
1. Share URLs with users
2. Collect feedback
3. Monitor performance
4. Scale as needed
