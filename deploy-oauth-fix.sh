#!/bin/bash

# Script to properly restart server with OAuth fixes and verify setup

echo "🔧 BVA Server OAuth Fix Deployment"
echo "===================================="
echo ""

# Step 1: Check if server is running
echo "📍 Step 1: Checking server status..."
SERVER_PID=$(pgrep -f "ts-node-dev.*server.ts" | head -1)

if [ -n "$SERVER_PID" ]; then
    echo "   ✅ Server is running (PID: $SERVER_PID)"
    echo "   🔄 Stopping server..."
    pkill -f "ts-node-dev.*server.ts"
    sleep 3
    echo "   ✅ Server stopped"
else
    echo "   ℹ️  Server is not running"
fi

echo ""
echo "📍 Step 2: Verifying OAuth fixes are in place..."

# Check if the fallback platform detection code exists
if grep -q "Platform detected from redirectUrl: LAZADA_CLONE" /home/marc/cloned/backup/bva-server/server/src/routes/auth.routes.ts; then
    echo "   ✅ OAuth fallback platform detection: PRESENT"
else
    echo "   ❌ OAuth fallback platform detection: MISSING"
    echo "   ⚠️  Please re-apply the OAuth fixes!"
    exit 1
fi

# Check if URL-encoded state decoding is present
if grep -q "decodeURIComponent(state)" /home/marc/cloned/backup/bva-server/server/src/routes/auth.routes.ts; then
    echo "   ✅ URL-encoded state decoding: PRESENT"
else
    echo "   ❌ URL-encoded state decoding: MISSING"
    echo "   ⚠️  Please re-apply the OAuth fixes!"
    exit 1
fi

echo ""
echo "📍 Step 3: Starting server..."
cd /home/marc/cloned/backup/bva-server/server
npm run dev > /tmp/bva-server.log 2>&1 &
SERVER_PID=$!

echo "   ⏳ Waiting for server to start (PID: $SERVER_PID)..."
sleep 10

# Check if server is listening on port 3000
if ss -tlnp 2>/dev/null | grep -q ":3000" || netstat -tlnp 2>/dev/null | grep -q ":3000"; then
    echo "   ✅ Server is listening on port 3000"
else
    echo "   ⚠️  Server may not be ready yet. Check logs: tail -f /tmp/bva-server.log"
fi

echo ""
echo "📍 Step 4: Database status..."
cd /home/marc/cloned/backup/bva-server/server
USER_COUNT=$(npx ts-node -e "import prisma from './src/lib/prisma'; prisma.user.count().then(c => console.log(c)).finally(() => process.exit());" 2>/dev/null)
SHOP_COUNT=$(npx ts-node -e "import prisma from './src/lib/prisma'; prisma.shop.count().then(c => console.log(c)).finally(() => process.exit());" 2>/dev/null)

echo "   📊 Users: ${USER_COUNT:-?}"
echo "   📊 Shops: ${SHOP_COUNT:-?}"

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "📝 Next Steps:"
echo "   1. Test OAuth login on Lazada Clone (http://localhost:3001)"
echo "   2. Register as seller via Google OAuth"
echo "   3. Check server logs for: '🔍 Platform detected from redirectUrl: LAZADA_CLONE'"
echo "   4. Verify shop created has platform: LAZADA"
echo ""
echo "📋 Useful Commands:"
echo "   • View server logs: tail -f /tmp/bva-server.log"
echo "   • Check server status: ps aux | grep ts-node-dev"
echo "   • Fix existing user shop: cd server && npx ts-node fix-user-shop-platform.ts"
echo ""
