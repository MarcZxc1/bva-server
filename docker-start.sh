#!/bin/bash

# Docker Quick Start Script for BVA Server
# This script helps teammates quickly set up and start all services

set -e

echo "🚀 BVA Server Docker Setup"
echo "=========================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install Docker Compose."
    exit 1
fi

echo "✅ Docker Compose is available"
echo ""

# Ask user what they want to do
echo "What would you like to do?"
echo "1) Start all services (first time setup)"
echo "2) Start all services (already built)"
echo "3) Stop all services"
echo "4) View logs"
echo "5) Rebuild and start all services"
echo "6) Clean up everything (remove containers, volumes, images)"
echo ""
read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo ""
        echo "🔨 Building and starting all services..."
        echo "This may take 5-10 minutes on first run..."
        docker-compose up -d --build
        echo ""
        echo "⏳ Waiting for services to be ready..."
        sleep 10
        echo ""
        echo "✅ Services are starting! Check status with: docker-compose ps"
        echo ""
        echo "📋 Service URLs:"
        echo "   - Main Server: http://localhost:3000"
        echo "   - ML Service: http://localhost:8001"
        echo "   - BVA Frontend: http://localhost:5173"
        echo "   - Lazada Clone: http://localhost:3001"
        echo "   - Shopee Clone: http://localhost:5174"
        echo "   - TikTok Seller: http://localhost:5175"
        echo ""
        echo "📝 Next steps:"
        echo "   1. Run database migrations: docker-compose exec main-server npx prisma migrate dev"
        echo "   2. Seed database: docker-compose exec main-server npm run db:seed-demo"
        echo "   3. View logs: docker-compose logs -f"
        ;;
    2)
        echo ""
        echo "🚀 Starting all services..."
        docker-compose up -d
        echo ""
        echo "✅ Services started!"
        echo "View logs with: docker-compose logs -f"
        ;;
    3)
        echo ""
        echo "🛑 Stopping all services..."
        docker-compose down
        echo ""
        echo "✅ All services stopped"
        ;;
    4)
        echo ""
        echo "📋 Viewing logs (Press Ctrl+C to exit)..."
        docker-compose logs -f
        ;;
    5)
        echo ""
        echo "🔨 Rebuilding and starting all services..."
        docker-compose up -d --build
        echo ""
        echo "✅ Services rebuilt and started!"
        ;;
    6)
        echo ""
        echo "⚠️  WARNING: This will remove all containers, volumes, and images!"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            echo ""
            echo "🧹 Cleaning up..."
            docker-compose down -v --rmi all
            echo ""
            echo "✅ Cleanup complete!"
        else
            echo "❌ Cleanup cancelled"
        fi
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

