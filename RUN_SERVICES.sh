#!/bin/bash

echo "🚀 Starting BVA Server Services..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Navigate to project root (if not already there)
cd "$(dirname "$0")"

echo "📦 Starting all services..."
docker compose up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 5

echo ""
echo "📊 Service Status:"
docker compose ps

echo ""
echo "✅ Services are starting!"
echo ""
echo "📍 Access your services at:"
echo "   - Main Dashboard: http://localhost:5173"
echo "   - Backend API: http://localhost:3000"
echo "   - ML Service: http://localhost:8001"
echo "   - ML Service Docs: http://localhost:8001/docs"
echo ""
echo "📋 View logs with: docker compose logs -f"
echo "🛑 Stop services with: docker compose down"
