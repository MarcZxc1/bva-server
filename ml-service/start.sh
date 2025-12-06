#!/bin/bash
# Start ML Service on port 8001

echo "🚀 Starting ML Service on port 8001..."
echo "📚 API Docs will be available at: http://localhost:8001/docs"
echo "🏥 Health check: http://localhost:8001/health"
echo ""
echo "⚠️  IMPORTANT: Using correct syntax: app.main:app (with dots, not colons)"
echo ""

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo "📦 Activating virtual environment..."
    source venv/bin/activate
fi

# Start uvicorn with correct syntax (app.main:app NOT app:main:app)
echo "🚀 Starting uvicorn server..."
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

