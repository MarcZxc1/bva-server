# Business Virtual Assistant (BVA) Server

A comprehensive business management platform with inventory management, AI-powered restocking, and multi-platform integrations.

## 📁 Project Structure

```
bva-server/
├── server/              # Backend API (Node.js/Express/TypeScript)
├── bva-frontend/        # Frontend application (React/Vite)
├── ml-service/          # Machine Learning service (Python/FastAPI)
├── shopee-clone/        # Shopee clone frontend
├── shopee-auth/         # Shopee authentication service
├── docs/                # Documentation files
├── scripts/            # Test scripts and utilities
└── config/             # Configuration files
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Python 3.9+ (for ML service)
- Redis 6+ (optional but recommended)
- Docker & Docker Compose (optional, for easy database setup)

### Quick Installation

```bash
# Clone repository
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
- **Backend Server** on `http://localhost:3000`
- **BVA Frontend** on `http://localhost:8080`
- **Shopee Clone** on `http://localhost:5173`
- **ML Service** on `http://localhost:8001`

### 📖 Complete Setup Guide

For detailed setup instructions, environment variables, database configuration, and troubleshooting, see:

**[📘 SETUP.md](./SETUP.md)** - Complete setup documentation

### Available Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start all services (uses `start-all.sh`) |
| `npm run dev` | Run all Node.js services concurrently |
| `npm run dev:server` | Run only backend server |
| `npm run dev:frontend` | Run only BVA frontend |
| `npm run dev:shopee` | Run only Shopee clone |
| `npm run build` | Build all services for production |
| `npm run install:all` | Install dependencies for all workspaces |

## 📚 Documentation

### Main Documentation

- **[SETUP.md](./SETUP.md)** - **Complete setup guide** (start here!)
- **[README_START.md](./README_START.md)** - Quick start guide for running services
- **[PORT_CONFIGURATION.md](./PORT_CONFIGURATION.md)** - Port configuration reference

### Setup & Configuration

- `SETUP.md` - Complete setup guide with environment variables
- `DOCKER_DEPLOYMENT.md` - Docker deployment guide
- `GEMINI_SETUP_GUIDE.md` - Google Gemini AI setup
- `server/VIEW_DATABASE.md` - Database viewing guide
- `server/CLEAR_DATABASE.md` - Database clearing guide

### Integration Guides

- `SHOPEE_CLONE_INTEGRATION.md` - Shopee Clone integration
- `SHOPEE_CLONE_SETUP.md` - Shopee Clone setup
- `AUTHENTICATION_IMPLEMENTATION.md` - Authentication system
- `REALTIME_IMPLEMENTATION.md` - WebSocket real-time updates
- `INTEGRATION_ARCHITECTURE.md` - Integration architecture
- `FACEBOOK_INSTAGRAM_INTEGRATION.md` - Social media integration

### Project Documentation

- `PROJECT_DOCUMENTATION.md` - Project overview
- `QUICK_REFERENCE.md` - Quick reference guide
- `MVP_INTEGRATION_SUMMARY.md` - MVP features
- `FEATURE_ALIGNMENT_VERIFICATION.md` - Feature alignment
- `DATA_JOURNEY_ANALYSIS.md` - Data flow analysis

## 🔧 Scripts

Test and utility scripts are in the `scripts/` directory:

- `test_auth_isolation.sh` - Test authentication isolation
- `test_image_generation.sh` - Test image generation
- `shopee-api-tests.http` - HTTP test requests

## ⚙️ Configuration

Configuration files are in the `config/` directory:

- `shopee-clone-schema.prisma` - Shopee clone database schema
- `shopee-package.json` - Shopee package configuration
- `shopee-tsconfig.json` - TypeScript configuration

## 🐛 Troubleshooting

For detailed troubleshooting, see the **[SETUP.md](./SETUP.md#troubleshooting)** guide.

### Quick Fixes

- **Port Already in Use:** Change ports in respective config files or kill the process
- **Database Connection:** Verify `DATABASE_URL` in `server/.env` and ensure PostgreSQL is running
- **ML Service Not Starting:** Check Python virtual environment and dependencies
- **CORS Issues:** Verify `FRONTEND_URL` in `server/.env` matches your frontend URL
- **Google OAuth:** Ensure redirect URIs are configured in Google Cloud Console

### Service URLs

Once running, access:
- **BVA Dashboard:** http://localhost:8080
- **Shopee Clone:** http://localhost:5173
- **Backend API:** http://localhost:3000/api
- **ML Service Docs:** http://localhost:8001/docs
- **Prisma Studio:** Run `npx prisma studio` in `server/` directory

## 📝 License

[Your License Here]

## 👥 Contributors

[Your Team Here]

