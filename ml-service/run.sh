#!/bin/bash
# ML Service Runner - Prevents common mistakes

echo "🚀 Starting ML Service..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Error: Virtual environment not found!"
    echo "   Please create it first: python3 -m venv venv"
    exit 1
fi

# Activate virtual environment
echo "📦 Activating virtual environment..."
source venv/bin/activate

# Verify we're in the right directory
if [ ! -f "app/main.py" ]; then
    echo "❌ Error: app/main.py not found!"
    echo "   Please run this script from the ml-service directory"
    exit 1
fi

# Check if FastAPI is installed
if ! python3 -c "from app.main import app" 2>/dev/null; then
    echo "❌ Error: Cannot import app. Installing dependencies..."
    pip install -r requirements.txt
fi

echo ""
echo "✅ Starting server on port 8001..."
echo "📚 API Docs: http://localhost:8001/docs"
echo "🏥 Health: http://localhost:8001/health"
echo ""
echo "⚠️  Using CORRECT syntax: app.main:app (with DOTS)"
echo ""

# Start with CORRECT syntax (app.main:app NOT app:main:app)
exec uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

