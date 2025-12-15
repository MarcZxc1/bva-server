# 📦 Deployment Files Summary

This document explains all the deployment-related files in your BVA project.

## 📋 Files Overview

### 1. Configuration Files

| File | Purpose | Used By |
|------|---------|---------|
| `render.yaml` | Render platform configuration | Render (Backend & ML) |
| `bva-frontend/vercel.json` | Vercel configuration for BVA Dashboard | Vercel |
| `shopee-clone/vercel.json` | Vercel configuration for Shopee Clone | Vercel |
| `lazada-clone/vercel.json` | Vercel configuration for Lazada Clone | Vercel |
| `docker-compose.prod.yml` | Production Docker setup | Self-hosted/VPS |
| `.env.production.example` | Production environment template | All services |

### 2. Docker Files

| File | Purpose |
|------|---------|
| `server/Dockerfile.prod` | Production Docker image for backend |
| `ml-service/Dockerfile.prod` | Production Docker image for ML service |

### 3. Documentation

| File | Purpose |
|------|---------|
| `DEPLOYMENT_GUIDE.md` | Complete deployment guide with step-by-step instructions |
| `DEPLOYMENT_CHECKLIST.md` | Interactive checklist for deployment process |
| `DEPLOYMENT_FILES.md` | This file - explains all deployment files |

### 4. Automation

| File | Purpose |
|------|---------|
| `.github/workflows/deploy.yml` | GitHub Actions CI/CD pipeline |
| `check-deployment-readiness.sh` | Deployment readiness validation script |

---

## 🔧 Detailed File Descriptions

### `render.yaml`

Blueprint file for Render platform. Automatically configures:
- Backend Node.js web service
- ML Python web service
- Environment variables
- Build & start commands
- Health checks

**Usage:**
1. Push to GitHub
2. Connect repository to Render
3. Render reads this file and auto-configures services

### `vercel.json` Files

Configuration for Vercel deployment:
- Build settings
- Route configurations
- Cache headers
- Environment variable mappings

**For SPA (Vite apps):**
```json
{
  "routes": [
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

**For Next.js:**
```json
{
  "env": {
    "NEXT_PUBLIC_VAR": "value"
  }
}
```

### `docker-compose.prod.yml`

Production-ready Docker Compose setup for self-hosting:
- PostgreSQL database
- Redis cache
- Backend service
- ML service

**Usage:**
```bash
# Copy environment template
cp .env.production.example .env.production

# Edit variables
nano .env.production

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

### `Dockerfile.prod` Files

Multi-stage production Docker images:
- Optimized for size
- Security hardened (non-root user)
- Health checks included
- Production-ready configuration

### `.env.production.example`

Template for production environment variables. Copy and customize:

```bash
cp .env.production.example .env.production
```

**Never commit `.env.production` to Git!**

### `.github/workflows/deploy.yml`

GitHub Actions workflow for CI/CD:
- Runs on push to main branch
- Builds and tests code
- Deploys to Render automatically

**Setup:**
1. Add secrets in GitHub repository settings:
   - `RENDER_API_KEY`
   - `RENDER_SERVICE_ID_BACKEND`
   - `RENDER_SERVICE_ID_ML`

### `check-deployment-readiness.sh`

Bash script that validates:
- ✅ Git repository setup
- ✅ All required files present
- ✅ Dependencies installed
- ✅ Code builds successfully
- ✅ Configuration files valid

**Usage:**
```bash
chmod +x check-deployment-readiness.sh
./check-deployment-readiness.sh
```

---

## 🎯 Deployment Strategies

### Strategy 1: Free Tier Cloud (Recommended for MVP)

**Best for:** Testing, MVP, small projects

**Stack:**
- Neon (PostgreSQL) - Free forever
- Upstash (Redis) - 10K commands/day
- Render (Backend) - 750 hours/month
- Vercel (Frontend) - Unlimited

**Files needed:**
- `render.yaml`
- `vercel.json` (all frontends)
- Environment variables in platform dashboards

**Setup time:** 30-60 minutes

**Cost:** $0/month

### Strategy 2: Docker Self-Hosted

**Best for:** Full control, dedicated server, VPS

**Stack:**
- Your VPS (DigitalOcean, Linode, AWS EC2, etc.)
- Docker & Docker Compose
- All services in containers

**Files needed:**
- `docker-compose.prod.yml`
- `.env.production`
- `Dockerfile.prod` (both services)

**Setup time:** 1-2 hours

**Cost:** VPS pricing ($5-20/month)

### Strategy 3: Kubernetes

**Best for:** Large scale, high availability

**Files needed:**
- Create Kubernetes manifests (not included, create as needed)
- Helm charts (optional)

**Setup time:** 4-8 hours

**Cost:** Cloud provider pricing

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Use strong JWT secret (32+ characters)
- [ ] Enable HTTPS (automatic on Vercel/Render)
- [ ] Set up CORS properly
- [ ] Never commit `.env` files
- [ ] Use environment variables for secrets
- [ ] Enable database SSL/TLS
- [ ] Set up rate limiting
- [ ] Configure firewall rules
- [ ] Enable monitoring and logging

---

## 📊 Platform Comparison

| Feature | Free Cloud | Docker Self-Hosted | Kubernetes |
|---------|------------|-------------------|------------|
| **Setup Time** | 30-60 min | 1-2 hours | 4-8 hours |
| **Cost** | $0/month | $5-20/month | $50+/month |
| **Scalability** | Limited | Medium | High |
| **Maintenance** | Low | Medium | High |
| **Control** | Limited | High | Full |
| **Best For** | MVP/Testing | Small-Medium | Enterprise |

---

## 🚀 Quick Start Commands

### Deploy to Free Cloud
```bash
# 1. Check readiness
./check-deployment-readiness.sh

# 2. Push to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# 3. Follow DEPLOYMENT_GUIDE.md
# No commands needed - use platform UIs
```

### Deploy with Docker
```bash
# 1. Prepare environment
cp .env.production.example .env.production
nano .env.production

# 2. Build and start
docker-compose -f docker-compose.prod.yml up -d

# 3. Check logs
docker-compose -f docker-compose.prod.yml logs -f

# 4. Run migrations
docker-compose exec backend npx prisma migrate deploy
```

### Update Deployment
```bash
# Free Cloud: Just push to GitHub
git push origin main

# Docker: Pull and restart
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 🆘 Troubleshooting

### "File not found" errors

**Solution:** Ensure you're in the project root directory:
```bash
cd /path/to/bva-server
```

### "Permission denied" on script

**Solution:** Make script executable:
```bash
chmod +x check-deployment-readiness.sh
```

### "Environment variable not set"

**Solution:** Check environment variables in your deployment platform dashboard

### Docker build fails

**Solution:** 
1. Clear Docker cache: `docker system prune -a`
2. Rebuild: `docker-compose -f docker-compose.prod.yml build --no-cache`

### Database connection fails

**Solution:**
1. Check DATABASE_URL format
2. Ensure SSL mode is set: `?sslmode=require`
3. Verify database is accessible (firewall, IP whitelist)

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Upstash Documentation](https://docs.upstash.com)
- [Docker Documentation](https://docs.docker.com)
- [GitHub Actions](https://docs.github.com/en/actions)

---

## 🎓 Learn More

### About the Stack

- **Node.js + Express:** Backend REST API
- **FastAPI:** Python ML service
- **React + Vite:** Modern frontend framework
- **Next.js:** Server-side rendering for Lazada clone
- **PostgreSQL:** Relational database
- **Redis:** Caching and session storage
- **Prisma:** Type-safe ORM

### About Deployment

- **Serverless:** Functions run on-demand, scale automatically
- **Containers:** Isolated environments, consistent across platforms
- **CI/CD:** Automatic deployment on code changes
- **Infrastructure as Code:** Configuration in files (render.yaml, docker-compose)

---

**Need help?** Check the [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) or open an issue!
