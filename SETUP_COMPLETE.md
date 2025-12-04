# BVA Server - Setup Complete! 🎉

## ✅ What's Been Set Up

1. **Environment Files Created**
   - `/server/.env` - Backend API configuration
   - `/ml-service/.env` - ML Service configuration

2. **Dependencies Installed**
   - ✅ Node.js Server packages installed
   - ✅ React Frontend packages installed
   - ✅ Python ML Service packages installed

3. **Database Ready**
   - ✅ PostgreSQL running on port 5432
   - ✅ Redis running on port 6379
   - ✅ Database schema migrated
   - ✅ Sample data seeded (64 products, 3720 sales records)

## 🚀 How to Run the Project

### Terminal 1: Backend Server
```bash
cd /home/marc/cloned/bva-server/server
npm run dev
```
The backend will run on **http://localhost:3000**

### Terminal 2: Frontend
```bash
cd /home/marc/cloned/bva-server/bva-frontend
npm run dev
```
The frontend will run on **http://localhost:5173**

### Terminal 3: ML Service
```bash
cd /home/marc/cloned/bva-server/ml-service
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```
The ML service will run on **http://localhost:8001**

## 📝 Test Credentials

- **Email**: admin@test.com
- **Password**: password123
- **Shop ID**: 2aad5d00-d302-4c57-86ad-99826e19e610

## 🔧 Docker Services

PostgreSQL and Redis are running in Docker containers:
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

To stop the containers:
```bash
docker compose down
```

To restart the containers:
```bash
docker compose up -d postgres redis
```

## 📋 Important Notes

1. **Gemini API Key**: Update `GEMINI_API_KEY` in `/ml-service/.env` for AI image generation features
2. **JWT Secret**: Change `JWT_SECRET` in `/server/.env` for production use
3. **Database URL**: Already configured to connect to the PostgreSQL container

## 🧪 Testing the API

You can test the API endpoints using:
- Postman collections in `/ml-service/` directory
- The frontend application once all services are running
- Direct API calls to http://localhost:3000/api/

## 📚 Documentation

Check out these files for more information:
- `PROJECT_DOCUMENTATION.md` - Overall project architecture
- `ml-service/README.md` - ML Service documentation
- `ml-service/API_EXAMPLES.md` - API usage examples
- `QUICK_REFERENCE.md` - Quick reference guide

## 🐛 Troubleshooting

**Database connection issues?**
```bash
docker compose ps  # Check if containers are running
docker compose logs postgres  # Check PostgreSQL logs
```

**Port already in use?**
- Change `PORT` in `/server/.env` for the backend
- Change `VITE_PORT` or use `--port` flag for frontend
- Change `PORT` in `/ml-service/.env` for ML service

**Module not found errors?**
```bash
# Re-install dependencies
cd server && npm install
cd ../bva-frontend && npm install
cd ../ml-service && python3 -m pip install -r requirements.txt
```

---

**Happy coding! 🚀**
