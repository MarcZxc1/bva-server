# QuickStart Script for SmartShelf ML Service
# Run this script to set up and start the development environment

Write-Host "🚀 SmartShelf ML Service - QuickStart" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

# Check Python version
Write-Host "Checking Python version..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($pythonVersion -match "Python 3\.1[0-9]") {
    Write-Host "✓ Python version OK: $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Python 3.10+ required. Current: $pythonVersion" -ForegroundColor Red
    exit 1
}

# Create virtual environment if it doesn't exist
if (-not (Test-Path "venv")) {
    Write-Host ""
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "✓ Virtual environment created" -ForegroundColor Green
}

# Activate virtual environment
Write-Host ""
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt --quiet
Write-Host "✓ Dependencies installed" -ForegroundColor Green

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✓ .env file created" -ForegroundColor Green
    Write-Host "  → Edit .env to customize settings" -ForegroundColor Cyan
}

# Create models directory
if (-not (Test-Path "models")) {
    Write-Host ""
    Write-Host "Creating models directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "models" | Out-Null
    Write-Host "✓ Models directory created" -ForegroundColor Green
}

# Check if Redis is running
Write-Host ""
Write-Host "Checking Redis..." -ForegroundColor Yellow
try {
    $redisTest = redis-cli ping 2>&1
    if ($redisTest -eq "PONG") {
        Write-Host "✓ Redis is running" -ForegroundColor Green
    } else {
        throw "Redis not responding"
    }
} catch {
    Write-Host "✗ Redis not available" -ForegroundColor Red
    Write-Host "  → Start Redis with: docker run -d -p 6379:6379 redis:7-alpine" -ForegroundColor Cyan
    Write-Host "  → Or use Docker Compose: docker-compose up -d redis" -ForegroundColor Cyan
}

# Run tests
Write-Host ""
$runTests = Read-Host "Run tests? (y/n)"
if ($runTests -eq "y") {
    Write-Host ""
    Write-Host "Running tests..." -ForegroundColor Yellow
    pytest app/tests/ -v --tb=short
}

# Start options
Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Setup complete! Choose how to start:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Docker Compose (recommended)" -ForegroundColor Cyan
Write-Host "   docker-compose up" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Local development (manual)" -ForegroundColor Cyan
Write-Host "   Terminal 1: uvicorn app.main:app --reload" -ForegroundColor Gray
Write-Host "   Terminal 2: celery -A app.tasks.celery_app worker --loglevel=info" -ForegroundColor Gray
Write-Host "   Terminal 3: celery -A app.tasks.celery_app beat --loglevel=info" -ForegroundColor Gray
Write-Host ""
Write-Host "3. API only (no background tasks)" -ForegroundColor Cyan
Write-Host "   uvicorn app.main:app --reload" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Enter choice (1-3) or 'q' to quit"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Starting with Docker Compose..." -ForegroundColor Yellow
        docker-compose up --build
    }
    "2" {
        Write-Host ""
        Write-Host "Starting local development server..." -ForegroundColor Yellow
        Write-Host "Press Ctrl+C to stop" -ForegroundColor Cyan
        uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    }
    "3" {
        Write-Host ""
        Write-Host "Starting API only..." -ForegroundColor Yellow
        Write-Host "Press Ctrl+C to stop" -ForegroundColor Cyan
        uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    }
    default {
        Write-Host ""
        Write-Host "Setup complete. Start manually when ready." -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "📚 Documentation: http://localhost:8000/docs" -ForegroundColor Green
Write-Host "🏥 Health check: http://localhost:8000/health" -ForegroundColor Green
