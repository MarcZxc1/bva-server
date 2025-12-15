# Business Virtual Assistant (BVA) Server

A comprehensive business management platform with inventory management, AI-powered restocking, and multi-platform integrations.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Python 3.9+ (for ML service)
- Git

### Installation

```bash
# Clone repository
git clone <repository-url>
cd bva-server

# Install all dependencies
npm run install:all

# Setup environment variables
cd server && cp .env.example .env
cd ../ml-service && cp .env.example .env
cd ../bva-frontend && cp .env.example .env
# Edit .env files with your configuration (see SETUP.md for details)

# Setup database
npx prisma migrate dev

# Start all services
npm start
```

## 📖 Documentation

For detailed guides, see:

**[📘 SETUP.md](./SETUP.md)** - Complete development setup (Windows & Linux)

**[🚀 DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Production deployment guide (Free tiers)

**[✅ DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Step-by-step deployment checklist

## 🚢 Deployment

Deploy your BVA project to production for **FREE** using:
- **Database**: Neon (3GB PostgreSQL)
- **Cache**: Upstash Redis (10K commands/day)
- **Backend**: Render (750 hours/month)
- **Frontend**: Vercel (Unlimited bandwidth)

### Quick Deployment Check

Run the deployment readiness check:

```bash
./check-deployment-readiness.sh
```

Then follow the [Deployment Guide](./DEPLOYMENT_GUIDE.md) or use the [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md).

## 📖 For Development Setup

**[📘 SETUP.md](./SETUP.md)** - Complete setup documentation

## 📁 Project Structure

```
bva-server/
├── server/              # Backend API (Node.js/Express/TypeScript)
├── bva-frontend/        # Frontend application (React/Vite)
├── ml-service/          # Machine Learning service (Python/FastAPI)
├── shopee-clone/        # Shopee clone frontend
├── lazada-clone/        # Lazada clone frontend (Next.js)
└── shopee-auth/         # Shopee authentication service
```

## 🎯 Available Services

Once running, access:

- **BVA Frontend:** http://localhost:8080
- **Backend API:** http://localhost:3000/api
- **Shopee Clone:** http://localhost:5174
- **Lazada Clone:** http://localhost:3001
- **ML Service Docs:** http://localhost:8001/docs

## 📝 Available Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start all services |
| `npm run dev` | Run all Node.js services concurrently |
| `npm run dev:server` | Run only backend server |
| `npm run dev:frontend` | Run only BVA frontend |
| `npm run dev:shopee` | Run only Shopee clone |
| `npm run dev:lazada` | Run only Lazada clone |
| `npm run build` | Build all services for production |
| `npm run install:all` | Install dependencies for all workspaces |

## 🔧 Key Features

- **Dashboard Analytics** - Real-time business metrics and insights
- **SmartShelf** - AI-powered inventory risk detection
- **Restock Planner** - Intelligent demand forecasting and restocking recommendations
- **MarketMate** - Marketing campaign management
- **Reports** - Comprehensive business reports and analytics
- **Multi-platform Integration** - Shopee-Clone and Lazada-Clone integration support

## 🛠️ Technology Stack

- **Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL
- **Frontend:** React, Vite, TypeScript, Tailwind CSS
- **ML Service:** Python, FastAPI, scikit-learn
- **Database:** PostgreSQL
- **Authentication:** JWT, OAuth2

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Complete setup guide for Windows and Linux
- **[SHOPEE_CLONE_INTEGRATION.md](./SHOPEE_CLONE_INTEGRATION.md)** - Integration guide
- **[DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)** - Docker deployment guide

## 🐛 Troubleshooting

For troubleshooting, see the **[SETUP.md](./SETUP.md#troubleshooting)** guide.

Common issues:
- **Port conflicts:** Change ports in config files or kill the process
- **Database connection:** Verify `DATABASE_URL` in `server/.env`
- **ML Service:** Check Python virtual environment and dependencies
- **CORS issues:** Verify `FRONTEND_URL` in `server/.env`

## 📝 License

[Your License Here]

## 👥 Contributors

[Your Team Here]
