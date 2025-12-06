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
- PostgreSQL
- Python 3.9+ (for ML service)
- Docker (optional)

### Installation

#### Option 1: Run All Services at Once (Recommended)

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all

# Run all services (server, bva-frontend, shopee-clone)
npm run dev
```

This will start:
- **Backend Server** on `http://localhost:3000`
- **BVA Frontend** on `http://localhost:8080`
- **Shopee Clone** on `http://localhost:5174`

#### Option 2: Run Services Individually

1. **Backend Server**
   ```bash
   cd server
   npm install
   npx prisma generate
   npx prisma migrate dev
   npm run dev
   ```

2. **BVA Frontend**
   ```bash
   cd bva-frontend
   npm install
   npm run dev
   ```

3. **Shopee Clone**
   ```bash
   cd shopee-clone
   npm install
   npm run dev
   ```

4. **ML Service** (separate)
   ```bash
   cd ml-service
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Run all services concurrently |
| `npm run dev:server` | Run only backend server |
| `npm run dev:frontend` | Run only BVA frontend |
| `npm run dev:shopee` | Run only Shopee clone |
| `npm run build` | Build all services |

## 📚 Documentation

- **Development Setup**: See `DEV_SETUP.md` for detailed setup instructions
- **Monorepo Pros/Cons**: See `MONOREPO_PROs_CONS.md` for analysis of the monorepo approach

All documentation is located in the `docs/` directory:

- **Setup Guides:**
  - `LINUX_SETUP.md` - Linux environment setup
  - `DOCKER_DEPLOYMENT.md` - Docker deployment guide
  - `SETUP_COMPLETE.md` - Initial setup checklist

- **Integration Guides:**
  - `SSO_IMPLEMENTATION_REPORT.md` - Single Sign-On implementation
  - `SHOPEE_README.md` - Shopee integration
  - `FACEBOOK_INSTAGRAM_INTEGRATION.md` - Social media integration
  - `GEMINI_SETUP_GUIDE.md` - Google Gemini AI setup

- **Project Documentation:**
  - `PROJECT_DOCUMENTATION.md` - Project overview
  - `QUICK_REFERENCE.md` - Quick reference guide
  - `MVP_INTEGRATION_SUMMARY.md` - MVP features

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

### Register Endpoint Issues

If you're getting 400 errors on registration:

1. **Double Password Hashing Fixed:** The password is now only hashed once (in middleware)
2. **Frontend Error Handling:** The API client now properly handles error responses
3. **Check Email Uniqueness:** Make sure the email isn't already registered

### Common Issues

- **Database Connection:** Check `DATABASE_URL` in `.env`
- **Port Conflicts:** Default ports: 3000 (backend), 5173 (frontend), 8001 (ML service)
- **CORS Issues:** Backend CORS is configured for `http://localhost:5173`

## 📝 License

[Your License Here]

## 👥 Contributors

[Your Team Here]

