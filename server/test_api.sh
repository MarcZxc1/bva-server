#!/bin/bash

echo "🔍 Testing BVA API Endpoints"
echo "=============================="

# Test credentials
EMAIL="admin@test.com"
PASSWORD="password123"
SHOP_ID="2aad5d00-d302-4c57-86ad-99826e19e610"

echo ""
echo "1️⃣ Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

echo "$LOGIN_RESPONSE" | jq '.'

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token // empty')

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed - no token received"
  exit 1
fi

echo ""
echo "✅ Login successful! Token: ${TOKEN:0:50}..."

echo ""
echo "2️⃣ Getting user info..."
USER_INFO=$(curl -s -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN")

echo "$USER_INFO" | jq '.'

USER_SHOP_ID=$(echo "$USER_INFO" | jq -r '.data.shops[0].id // empty')
echo ""
echo "User's Shop ID: $USER_SHOP_ID"

echo ""
echo "3️⃣ Testing SmartShelf At-Risk Inventory..."
ATRISK_RESPONSE=$(curl -s -X GET "http://localhost:3000/api/smart-shelf/$SHOP_ID/at-risk" \
  -H "Authorization: Bearer $TOKEN")

echo "$ATRISK_RESPONSE" | jq '.'

echo ""
echo "4️⃣ Testing SmartShelf Dashboard..."
DASHBOARD_RESPONSE=$(curl -s -X GET "http://localhost:3000/api/smart-shelf/$SHOP_ID/dashboard" \
  -H "Authorization: Bearer $TOKEN")

echo "$DASHBOARD_RESPONSE" | jq '.'

echo ""
echo "5️⃣ Testing RestockPlanner..."
RESTOCK_RESPONSE=$(curl -s -X POST http://localhost:3000/api/ai/restock-strategy \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"shopId\":\"$SHOP_ID\",\"budget\":50000,\"goal\":\"balanced\",\"restockDays\":14}")

echo "$RESTOCK_RESPONSE" | jq '.'

echo ""
echo "✅ Test complete!"
