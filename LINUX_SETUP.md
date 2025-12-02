# Linux Setup Guide - Virtual Business Assistant

Complete setup guide for deploying the Virtual Business Assistant on a fresh Linux machine.

## Prerequisites Installation

### 1. Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Git

```bash
sudo apt install git -y
git --version
```

### 3. Install Docker Engine

```bash
# Remove old versions
sudo apt remove docker docker-engine docker.io containerd runc

# Install dependencies
sudo apt install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify installation
docker --version
docker compose version

# Add your user to docker group (avoid using sudo)
sudo usermod -aG docker $USER
newgrp docker

# Test Docker
docker run hello-world
```

### 4. Install Node.js and npm

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 5. Install Python 3.11

```bash
# Add deadsnakes PPA for Python 3.11
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt update

# Install Python 3.11 and pip
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Verify installation
python3.11 --version
pip3 --version
```

## Application Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/MarcZxc1/bva-server.git

# Navigate to project directory
cd bva-server
```

### 2. Start Docker Services (PostgreSQL + Redis)

```bash
# Start PostgreSQL and Redis containers
docker compose up -d postgres redis

# Wait for services to be healthy (10-30 seconds)
docker compose ps

# Check logs to ensure they're running
docker compose logs postgres
docker compose logs redis
```

**Expected output:**

- PostgreSQL: `database system is ready to accept connections`
- Redis: `Ready to accept connections`

### 3. Backend Server Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/virtual_business_assistant
ML_SERVICE_URL=http://localhost:8001
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
EOF

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database with initial data
npx prisma db seed

# Start the backend server
npm run dev
```

**Backend should be running on:** http://localhost:5000

Keep this terminal open. Open a new terminal for the next steps.

### 4. ML Service Setup

```bash
# Navigate to ml-service directory
cd bva-server/ml-service

# Create Python virtual environment
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install Python dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1
MODEL_DIR=./models
LOG_LEVEL=INFO
PORT=8001
EOF

# Start the ML service
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

**ML Service should be running on:** http://localhost:8001

Keep this terminal open. Open a new terminal for the frontend.

### 5. Frontend Setup

```bash
# Navigate to frontend directory
cd bva-server/bva-frontend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
VITE_API_BASE_URL=http://localhost:5000
EOF

# Start the frontend development server
npm run dev
```

**Frontend should be running on:** http://localhost:8080

## Verify Installation

### 1. Check All Services

Open new terminal:

```bash
# Check Docker services
docker compose ps

# Should show postgres and redis as healthy
```

### 2. Test Backend API

```bash
curl http://localhost:5000/api/health
# Should return: {"status":"ok"}
```

### 3. Test ML Service

```bash
curl http://localhost:8001/health
# Should return: {"status":"healthy"}

# View API documentation
# Open in browser: http://localhost:8001/docs
```

### 4. Access Frontend

Open browser and navigate to: http://localhost:8080

**Default login credentials** (from seed data):

- Email: `admin@shop1.com`
- Password: Check `server/prisma/seed.ts` for the password

## Running All Services

You'll need **3 terminal windows**:

**Terminal 1 - Backend:**

```bash
cd bva-server/server
npm run dev
```

**Terminal 2 - ML Service:**

```bash
cd bva-server/ml-service
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 3 - Frontend:**

```bash
cd bva-server/bva-frontend
npm run dev
```

**Docker (runs in background):**

```bash
docker compose up -d postgres redis
```

## Helpful Commands

### Docker Management

```bash
# View running containers
docker compose ps

# View logs
docker compose logs -f postgres
docker compose logs -f redis

# Stop services
docker compose down

# Restart services
docker compose restart postgres redis

# Remove all data (careful!)
docker compose down -v
```

### Database Management

```bash
# Open Prisma Studio (Database GUI)
cd server
npx prisma studio
# Opens at http://localhost:5555

# Access PostgreSQL CLI
docker exec -it vba-postgres psql -U postgres -d virtual_business_assistant

# Reset database
npx prisma migrate reset

# Run migrations only
npx prisma migrate deploy
```

### Check Service Status

```bash
# Check if ports are in use
sudo lsof -i :5000  # Backend
sudo lsof -i :8001  # ML Service
sudo lsof -i :8080  # Frontend
sudo lsof -i :5432  # PostgreSQL
sudo lsof -i :6379  # Redis

# View running processes
ps aux | grep node
ps aux | grep uvicorn
ps aux | grep docker
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using the port
sudo lsof -i :5000

# Kill the process
sudo kill -9 <PID>
```

### PostgreSQL Connection Failed

```bash
# Check if PostgreSQL is running
docker compose ps postgres

# View PostgreSQL logs
docker compose logs postgres

# Restart PostgreSQL
docker compose restart postgres

# Check connection
docker exec -it vba-postgres pg_isready -U postgres
```

### Node Module Issues

```bash
# Clear node_modules and reinstall
cd server  # or bva-frontend
rm -rf node_modules package-lock.json
npm install
```

### Python Virtual Environment Issues

```bash
# Recreate virtual environment
cd ml-service
rm -rf venv
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Docker Permission Denied

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again, or run:
newgrp docker

# Verify
docker run hello-world
```

### Cannot Connect to Docker Daemon

```bash
# Start Docker service
sudo systemctl start docker

# Enable Docker to start on boot
sudo systemctl enable docker

# Check status
sudo systemctl status docker
```

## Setting Up as System Services (Production)

### Backend Service

Create `/etc/systemd/system/bva-backend.service`:

```ini
[Unit]
Description=BVA Backend Server
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/bva-server/server
Environment="NODE_ENV=production"
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### ML Service

Create `/etc/systemd/system/bva-ml.service`:

```ini
[Unit]
Description=BVA ML Service
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/bva-server/ml-service
Environment="PATH=/path/to/bva-server/ml-service/venv/bin"
ExecStart=/path/to/bva-server/ml-service/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8001
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### Enable and Start Services

```bash
sudo systemctl daemon-reload
sudo systemctl enable bva-backend bva-ml
sudo systemctl start bva-backend bva-ml
sudo systemctl status bva-backend bva-ml
```

## Environment Variables Summary

### Backend (.env in server/)

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/virtual_business_assistant
ML_SERVICE_URL=http://localhost:8001
PORT=5000
JWT_SECRET=change-this-to-a-secure-random-string
NODE_ENV=development
```

### ML Service (.env in ml-service/)

```env
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1
MODEL_DIR=./models
LOG_LEVEL=INFO
PORT=8001
```

### Frontend (.env in bva-frontend/)

```env
VITE_API_BASE_URL=http://localhost:5000
```

## Firewall Configuration (Production)

```bash
# Allow necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 5000/tcp  # Backend (or use reverse proxy)
sudo ufw allow 8001/tcp  # ML Service (or use reverse proxy)
sudo ufw allow 8080/tcp  # Frontend (or use reverse proxy)

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Next Steps

1. ✅ All services should be running
2. ✅ Access frontend at http://localhost:8080
3. ✅ Login with seeded user credentials
4. ✅ Navigate to Smart Inventory to see ML-powered analysis
5. ✅ Test creating products, viewing analytics, etc.

## Production Deployment

For production deployment:

1. Use reverse proxy (Nginx/Traefik) for SSL and routing
2. Change all passwords and secrets
3. Set `NODE_ENV=production`
4. Build frontend for production: `npm run build`
5. Use PM2 or systemd for process management
6. Set up automatic backups for PostgreSQL
7. Configure monitoring and logging

## Support

For issues:

- Check logs: `docker compose logs -f`
- Verify services: `docker compose ps`
- Test connections: `curl http://localhost:5000/api/health`
- Review troubleshooting section above

## Updates

To update the application:

```bash
cd bva-server
git pull origin main

# Update backend
cd server
npm install
npx prisma migrate deploy
npm run dev

# Update ML service
cd ../ml-service
source venv/bin/activate
pip install -r requirements.txt

# Update frontend
cd ../bva-frontend
npm install
npm run dev
```
