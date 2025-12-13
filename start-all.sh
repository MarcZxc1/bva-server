#!/bin/bash

# BVA Server - Start All Services Script
# This script starts all services: Database, ML Service, Server, BVA Frontend, Shopee Clone, and Lazada Clone

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if a port is in use
check_port() {
    port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to wait for a service to be ready
wait_for_service() {
    port=$1
    service_name=$2
    max_attempts=30
    attempt=0
    
    print_message "$YELLOW" "Waiting for $service_name to be ready on port $port..."
    
    while [ $attempt -lt $max_attempts ]; do
        if check_port $port; then
            print_message "$GREEN" "✓ $service_name is ready!"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    
    print_message "$RED" "✗ $service_name failed to start on port $port"
    return 1
}

# Function to cleanup on exit
cleanup() {
    print_message "$YELLOW" "\nShutting down all services..."
    kill $(jobs -p) 2>/dev/null || true
    wait
    print_message "$GREEN" "All services stopped."
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

print_message "$CYAN" "=========================================="
print_message "$CYAN" "  BVA Server - Starting All Services"
print_message "$CYAN" "=========================================="
echo ""

# Check if required commands exist
command -v node >/dev/null 2>&1 || { print_message "$RED" "Error: node is not installed. Please install Node.js."; exit 1; }
command -v npm >/dev/null 2>&1 || { print_message "$RED" "Error: npm is not installed. Please install npm."; exit 1; }
command -v python3 >/dev/null 2>&1 || { print_message "$RED" "Error: python3 is not installed. Please install Python 3."; exit 1; }

# Check if concurrently is installed
if ! npm list -g concurrently >/dev/null 2>&1 && ! npm list concurrently >/dev/null 2>&1; then
    print_message "$YELLOW" "Installing concurrently..."
    npm install concurrently --save-dev
fi

# Check if database is running (PostgreSQL)
print_message "$BLUE" "Checking PostgreSQL database..."
if check_port 5432; then
    print_message "$GREEN" "✓ PostgreSQL is already running on port 5432"
else
    print_message "$YELLOW" "⚠ PostgreSQL is not running. Please start it manually or use docker-compose."
    print_message "$YELLOW" "  Run: docker-compose up -d postgres"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if Redis is running (optional for ML service)
print_message "$BLUE" "Checking Redis..."
if check_port 6379; then
    print_message "$GREEN" "✓ Redis is already running on port 6379"
else
    print_message "$YELLOW" "⚠ Redis is not running. ML service may not work properly."
    print_message "$YELLOW" "  Run: docker-compose up -d redis"
fi

# Start ML Service
print_message "$BLUE" "Starting ML Service..."
cd ml-service
if [ ! -d "venv" ]; then
    print_message "$YELLOW" "Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null || true

if [ ! -f "venv/bin/activate" ] && [ ! -f "venv/Scripts/activate" ]; then
    print_message "$RED" "Error: Could not activate virtual environment"
    exit 1
fi

# Install dependencies if needed
if [ ! -f "venv/.installed" ]; then
    print_message "$YELLOW" "Installing ML Service dependencies..."
    pip install -q -r requirements.txt
    touch venv/.installed
fi

# Start ML service in background
print_message "$GREEN" "Starting ML Service on port 8001..."
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload > ../ml-service.log 2>&1 &
ML_PID=$!
cd ..

# Wait for ML service
sleep 3
wait_for_service 8001 "ML Service" || print_message "$YELLOW" "ML Service may still be starting..."

# Start all Node.js services using concurrently
print_message "$BLUE" "Starting Node.js services (Server, BVA Frontend, Shopee Clone, Lazada Clone)..."
print_message "$CYAN" "Services will be available at:"
print_message "$CYAN" "  - Server:        http://localhost:3000"
print_message "$CYAN" "  - BVA Frontend:  http://localhost:8080"
print_message "$CYAN" "  - Shopee Clone:  http://localhost:5174"
print_message "$CYAN" "  - Lazada Clone:  http://localhost:3001"
print_message "$CYAN" "  - ML Service:    http://localhost:8001"
echo ""

# Use npm script if available, otherwise use concurrently directly
if npm run dev >/dev/null 2>&1; then
    npm run dev
else
    # Fallback: use concurrently directly
    npx concurrently \
        -n "SERVER,FRONTEND,SHOPEE,LAZADA" \
        -c "blue,green,yellow,magenta" \
        "cd server && npm run dev" \
        "cd bva-frontend && npm run dev" \
        "cd shopee-clone && npm run dev" \
        "cd lazada-clone && npm run dev"
fi

